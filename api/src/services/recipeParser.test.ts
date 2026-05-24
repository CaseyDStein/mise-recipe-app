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
  beforeEach(() => vi.clearAllMocks());

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
