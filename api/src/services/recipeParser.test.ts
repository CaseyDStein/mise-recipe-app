import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll test the JSON-LD parser by exercising the module internals
// For full integration tests the URL fetch is mocked

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Defer import so stubGlobal takes effect first
const { parseRecipeFromUrl } = await import('./recipeParser');

function makeHtml(jsonLd: object) {
  return `<html><head><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body></body></html>`;
}

function mockUrl(html: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    text: () => Promise.resolve(html),
  });
}

describe('parseRecipeFromUrl - JSON-LD parsing', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('parses a basic Schema.org Recipe', async () => {
    mockUrl(makeHtml({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: 'Classic Pasta',
      description: 'A simple pasta dish',
      recipeIngredient: ['2 cups pasta', '1 tsp salt', '2 tbsp olive oil'],
      recipeInstructions: [
        { '@type': 'HowToStep', text: 'Boil water.' },
        { '@type': 'HowToStep', text: 'Cook pasta.' },
      ],
      prepTime: 'PT10M',
      cookTime: 'PT20M',
      recipeYield: '4 servings',
      recipeCuisine: 'Italian',
    }));

    const result = await parseRecipeFromUrl('https://example.com/pasta');
    expect(result.title).toBe('Classic Pasta');
    expect(result.description).toBe('A simple pasta dish');
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0].text).toBe('2 cups pasta');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].text).toBe('Boil water.');
    expect(result.steps[0].order).toBe(1);
    expect(result.prepTimeMinutes).toBe(10);
    expect(result.cookTimeMinutes).toBe(20);
    expect(result.servings).toBe(4);
    expect(result.cuisine).toBe('Italian');
  });

  it('parses nutritional info from schema', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Healthy Bowl',
      recipeIngredient: ['1 cup quinoa'],
      recipeInstructions: [{ text: 'Cook quinoa.' }],
      nutrition: {
        '@type': 'NutritionInformation',
        calories: '350 calories',
        fatContent: '12g',
        proteinContent: '15g',
        carbohydrateContent: '45g',
        sodiumContent: '300mg',
      },
    }));

    const result = await parseRecipeFromUrl('https://example.com/bowl');
    expect(result.nutritionalInfo).toBeDefined();
    expect(result.nutritionalInfo?.calories).toBe(350);
    expect(result.nutritionalInfo?.proteinG).toBe(15);
    expect(result.nutritionalInfo?.totalCarbsG).toBe(45);
  });

  it('handles @graph schema format', async () => {
    mockUrl(makeHtml({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: 'Some page' },
        {
          '@type': 'Recipe',
          name: 'Graph Recipe',
          recipeIngredient: ['1 egg'],
          recipeInstructions: [{ text: 'Crack egg.' }],
        },
      ],
    }));

    const result = await parseRecipeFromUrl('https://example.com/graph');
    expect(result.title).toBe('Graph Recipe');
    expect(result.ingredients[0].text).toBe('1 egg');
  });

  it('throws when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });
    await expect(parseRecipeFromUrl('https://example.com/404')).rejects.toThrow('Failed to fetch URL');
  });

  it('handles HowToSection instructions', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Multi-section Recipe',
      recipeIngredient: ['1 cup flour'],
      recipeInstructions: [
        {
          '@type': 'HowToSection',
          name: 'Prep',
          itemListElement: [
            { '@type': 'HowToStep', text: 'Measure flour.' },
            { '@type': 'HowToStep', text: 'Sift flour.' },
          ],
        },
      ],
    }));

    const result = await parseRecipeFromUrl('https://example.com/sections');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].text).toBe('Measure flour.');
  });

  it('parses ingredient quantities', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Test',
      recipeIngredient: ['2 cups all-purpose flour', '1/2 tsp baking powder'],
      recipeInstructions: [{ text: 'Mix.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/test');
    expect(result.ingredients[0].quantity).toBe('2');
    expect(result.ingredients[0].unit).toBe('cups');
  });
});

describe('parseRecipeFromUrl - HTML entity decoding', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('decodes decimal numeric entities (&#039;) in description', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Spaghetti Pomodoro',
      description: "The pasta from &#039;The Bear&#039; highlights tomato as the main flavor.",
      recipeIngredient: ['400g spaghetti'],
      recipeInstructions: [{ text: 'Cook pasta.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/pasta');
    expect(result.description).toBe("The pasta from 'The Bear' highlights tomato as the main flavor.");
  });

  it('decodes decimal numeric entities in title', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: "Grandma&#039;s Apple Pie",
      recipeIngredient: ['2 apples'],
      recipeInstructions: [{ text: 'Bake.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/pie');
    expect(result.title).toBe("Grandma's Apple Pie");
  });

  it('decodes entities in step text', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Test Recipe',
      recipeIngredient: ['1 cup sugar'],
      recipeInstructions: [
        { '@type': 'HowToStep', text: "Don&#039;t overcook &amp; stir constantly." },
        { '@type': 'HowToStep', text: 'Season with salt &amp; pepper.' },
      ],
    }));

    const result = await parseRecipeFromUrl('https://example.com/steps');
    expect(result.steps[0].text).toBe("Don't overcook & stir constantly.");
    expect(result.steps[1].text).toBe('Season with salt & pepper.');
  });

  it('decodes entities in HowToSection step text', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Sectioned Recipe',
      recipeIngredient: ['1 egg'],
      recipeInstructions: [{
        '@type': 'HowToSection',
        name: 'Prep',
        itemListElement: [
          { '@type': 'HowToStep', text: "Chef&#039;s tip: use fresh eggs." },
        ],
      }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/sections');
    expect(result.steps[0].text).toBe("Chef's tip: use fresh eggs.");
  });

  it('decodes entities in ingredient text', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Test',
      recipeIngredient: ["2 tbsp chef&#039;s choice oil", "1 &amp; 1/2 cups flour"],
      recipeInstructions: [{ text: 'Mix.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/ingredients');
    expect(result.ingredients[0].text).toBe("2 tbsp chef's choice oil");
    expect(result.ingredients[1].text).toBe('1 & 1/2 cups flour');
  });

  it('decodes entities in cuisine and category', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Test',
      recipeIngredient: ['1 cup rice'],
      recipeInstructions: [{ text: 'Cook.' }],
      recipeCuisine: 'French &amp; Italian',
      recipeCategory: 'Main &amp; Side',
    }));

    const result = await parseRecipeFromUrl('https://example.com/cuisine');
    expect(result.cuisine).toBe('French & Italian');
    expect(result.category).toBe('Main & Side');
  });

  it('decodes named HTML entities (&lt; &gt; &quot; &apos;)', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Test &lt;Recipe&gt;',
      description: 'Use &quot;high heat&quot; &amp; don&apos;t rush.',
      recipeIngredient: ['1 cup water'],
      recipeInstructions: [{ text: 'Heat.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/named');
    expect(result.title).toBe('Test <Recipe>');
    expect(result.description).toBe('Use "high heat" & don\'t rush.');
  });

  it('decodes hex numeric entities (&#x27;)', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: "Cook&#x27;s Special",
      description: 'A dish with &#x26; flair.',
      recipeIngredient: ['1 cup stock'],
      recipeInstructions: [{ text: 'Simmer.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/hex');
    expect(result.title).toBe("Cook's Special");
    expect(result.description).toBe('A dish with & flair.');
  });

  it('leaves plain text unchanged when no entities are present', async () => {
    mockUrl(makeHtml({
      '@type': 'Recipe',
      name: 'Simple Soup',
      description: 'A hearty bowl of soup.',
      recipeIngredient: ['2 cups broth'],
      recipeInstructions: [{ text: 'Boil broth.' }],
    }));

    const result = await parseRecipeFromUrl('https://example.com/plain');
    expect(result.title).toBe('Simple Soup');
    expect(result.description).toBe('A hearty bowl of soup.');
    expect(result.steps[0].text).toBe('Boil broth.');
  });
});
