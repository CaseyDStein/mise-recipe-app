import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

interface ParsedIngredient { text: string; quantity?: string; unit?: string; name?: string; notes?: string }
interface ParsedStep { order: number; text: string }
interface ParsedNutrition {
  servings?: number; servingSize?: string; calories?: number;
  totalFatG?: number; saturatedFatG?: number; transFatG?: number;
  cholesterolMg?: number; sodiumMg?: number; totalCarbsG?: number;
  dietaryFiberG?: number; totalSugarsG?: number; proteinG?: number;
}

interface ParsedRecipe {
  title: string;
  description?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings?: number;
  cuisine?: string;
  category?: string;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  nutritionalInfo?: ParsedNutrition;
}

function parseISODuration(iso: string): number | undefined {
  if (!iso) return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes || undefined;
}

function parseNutrition(nutrition: Record<string, string>): ParsedNutrition | undefined {
  if (!nutrition || typeof nutrition !== 'object') return undefined;
  const parseNum = (v: string) => v ? parseFloat(v.replace(/[^\d.]/g, '')) || undefined : undefined;
  return {
    servings: parseNum(nutrition.servingSize ?? ''),
    servingSize: nutrition.servingSize,
    calories: parseNum(nutrition.calories ?? ''),
    totalFatG: parseNum(nutrition.fatContent ?? ''),
    saturatedFatG: parseNum(nutrition.saturatedFatContent ?? ''),
    transFatG: parseNum(nutrition.transFatContent ?? ''),
    cholesterolMg: parseNum(nutrition.cholesterolContent ?? ''),
    sodiumMg: parseNum(nutrition.sodiumContent ?? ''),
    totalCarbsG: parseNum(nutrition.carbohydrateContent ?? ''),
    dietaryFiberG: parseNum(nutrition.fiberContent ?? ''),
    totalSugarsG: parseNum(nutrition.sugarContent ?? ''),
    proteinG: parseNum(nutrition.proteinContent ?? ''),
  };
}

function parseIngredientText(text: string): ParsedIngredient {
  // Basic parsing: try to extract quantity and unit from the start of the text
  const match = text.match(/^([\d\s¼-¾⅐-⅞\/]+)\s*([a-zA-Z]+\.?)?\s+(.+)$/);
  if (match) {
    return { text, quantity: match[1]?.trim(), unit: match[2]?.trim(), name: match[3]?.trim() };
  }
  return { text };
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' },
  });
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

  const html = await response.text();
  const $ = cheerio.load(html);

  // Try Schema.org JSON-LD first
  const jsonLdResult = tryParseJsonLd($, url);
  if (jsonLdResult) return jsonLdResult;

  // Fall back to Claude AI extraction
  return parseWithClaude(html, url);
}

function tryParseJsonLd($: ReturnType<typeof cheerio.load>, url: string): ParsedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html() || '';
      const data = JSON.parse(raw);
      const schemas = Array.isArray(data) ? data : [data];

      for (const schema of schemas) {
        // Handle @graph
        const items = schema['@graph'] ? schema['@graph'] : [schema];
        for (const item of items) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            return extractFromSchema(item, url);
          }
        }
      }
    } catch {
      // Continue to next script tag
    }
  }
  return null;
}

function extractImageUrl(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    for (const item of image) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
    return undefined;
  }
  if (typeof image === 'object' && image !== null) {
    const obj = image as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj.contentUrl === 'string') return obj.contentUrl;
  }
  return undefined;
}

function extractFromSchema(schema: Record<string, unknown>, _url: string): ParsedRecipe {
  const ingredientList = (schema.recipeIngredient as string[] | undefined) || [];
  const instructionList = schema.recipeInstructions as unknown[] | undefined || [];

  const steps: ParsedRecipe['steps'] = [];
  instructionList.forEach((inst, idx) => {
    if (typeof inst === 'string') {
      steps.push({ order: idx + 1, text: inst });
    } else if (typeof inst === 'object' && inst !== null) {
      const obj = inst as Record<string, unknown>;
      if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
        (obj.itemListElement as Record<string, unknown>[]).forEach((step) => {
          steps.push({ order: steps.length + 1, text: (step.text || step.name || '') as string });
        });
      } else {
        steps.push({ order: idx + 1, text: (obj.text || obj.name || '') as string });
      }
    }
  });

  const parseYield = (y: unknown): number | undefined => {
    if (!y) return undefined;
    const s = Array.isArray(y) ? y[0] : y;
    const n = parseInt(String(s).replace(/\D/g, ''));
    return isNaN(n) ? undefined : n;
  };

  return {
    title: (schema.name as string) || 'Untitled Recipe',
    description: schema.description as string | undefined,
    imageUrl: extractImageUrl(schema.image),
    prepTimeMinutes: parseISODuration(schema.prepTime as string),
    cookTimeMinutes: parseISODuration(schema.cookTime as string),
    totalTimeMinutes: parseISODuration(schema.totalTime as string),
    servings: parseYield(schema.recipeYield),
    cuisine: Array.isArray(schema.recipeCuisine) ? schema.recipeCuisine[0] : schema.recipeCuisine as string | undefined,
    category: Array.isArray(schema.recipeCategory) ? schema.recipeCategory[0] : schema.recipeCategory as string | undefined,
    ingredients: ingredientList.map(parseIngredientText),
    steps,
    nutritionalInfo: parseNutrition(schema.nutrition as Record<string, string>),
  };
}

async function parseWithClaude(html: string, url: string): Promise<ParsedRecipe> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No ANTHROPIC_API_KEY set and page has no structured recipe data');

  const client = new Anthropic({ apiKey });

  // Strip HTML tags for cleaner input, limit length
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 15000);

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Extract the recipe from this web page content. Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "title": "string",
  "description": "string or null",
  "imageUrl": "string or null",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "totalTimeMinutes": number or null,
  "servings": number or null,
  "cuisine": "string or null",
  "category": "string or null",
  "ingredients": [{"text": "full ingredient text", "quantity": "amount or null", "unit": "unit or null", "name": "ingredient name or null"}],
  "steps": [{"order": 1, "text": "step text"}],
  "nutritionalInfo": {"calories": number, "proteinG": number, "totalCarbsG": number, "totalFatG": number, "sodiumMg": number, "dietaryFiberG": number} or null
}

URL: ${url}

Page content:
${text}`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  const parsed = JSON.parse(content.text);
  return {
    title: parsed.title || 'Untitled Recipe',
    description: parsed.description || undefined,
    imageUrl: parsed.imageUrl || undefined,
    prepTimeMinutes: parsed.prepTimeMinutes || undefined,
    cookTimeMinutes: parsed.cookTimeMinutes || undefined,
    totalTimeMinutes: parsed.totalTimeMinutes || undefined,
    servings: parsed.servings || undefined,
    cuisine: parsed.cuisine || undefined,
    category: parsed.category || undefined,
    ingredients: (parsed.ingredients || []).map((i: Partial<ParsedIngredient>) => ({
      text: i.text || '',
      quantity: i.quantity || undefined,
      unit: i.unit || undefined,
      name: i.name || undefined,
    })),
    steps: (parsed.steps || []).map((s: Partial<ParsedStep>, idx: number) => ({
      order: s.order || idx + 1,
      text: s.text || '',
    })),
    nutritionalInfo: parsed.nutritionalInfo || undefined,
  };
}
