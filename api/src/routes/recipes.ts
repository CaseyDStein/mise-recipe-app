import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { parseRecipeFromUrl } from '../services/recipeParser';

export const recipesRouter = Router();
recipesRouter.use(requireAuth);

const importSchema = z.object({ url: z.string().url() });
const searchSchema = z.object({
  query: z.string().optional(),
  collectionId: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// POST /api/recipes/import
recipesRouter.post('/import', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.message });

  try {
    const data = await parseRecipeFromUrl(parsed.data.url);

    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: data.title,
        source_url: parsed.data.url,
        image_url: data.imageUrl,
        description: data.description,
        prep_time_minutes: data.prepTimeMinutes,
        cook_time_minutes: data.cookTimeMinutes,
        total_time_minutes: data.totalTimeMinutes,
        servings: data.servings,
        cuisine: data.cuisine,
        category: data.category,
      })
      .select()
      .single();

    if (recipeErr) throw recipeErr;

    if (data.ingredients.length > 0) {
      await supabase.from('ingredients').insert(
        data.ingredients.map((ing, idx) => ({
          recipe_id: recipe.id,
          text: ing.text,
          quantity: ing.quantity,
          unit: ing.unit,
          name: ing.name,
          notes: ing.notes,
          sort_order: idx,
        }))
      );
    }

    if (data.steps.length > 0) {
      await supabase.from('steps').insert(
        data.steps.map((step) => ({
          recipe_id: recipe.id,
          order_num: step.order,
          text: step.text,
        }))
      );
    }

    if (data.cuisine) {
      const cuisineTag = data.cuisine.trim().toLowerCase();
      const { data: tag } = await supabase
        .from('tags')
        .upsert({ user_id: userId, name: cuisineTag }, { onConflict: 'user_id,name' })
        .select('id')
        .single();
      if (tag) {
        await supabase.from('recipe_tags').upsert({ recipe_id: recipe.id, tag_id: tag.id });
      }
    }

    if (data.nutritionalInfo) {
      await supabase.from('nutritional_info').insert({
        recipe_id: recipe.id,
        ...data.nutritionalInfo,
      });
    }

    const fullRecipe = await fetchFullRecipe(recipe.id, userId);
    res.status(201).json({ recipe: fullRecipe });
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Failed to import recipe';
    res.status(422).json({ error: message });
  }
});

// GET /api/recipes
recipesRouter.get('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query params' });

  const { query, collectionId, tags, page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;

  let dbQuery = supabase
    .from('recipes')
    .select('id, title, source_url, image_url, description, total_time_minutes, servings, cuisine, category, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (query) {
    const term = query.trim();
    // Run all field searches in parallel; ingredients live in a separate table
    const [ingText, ingName, titleRows, descRows, cuisineRows] = await Promise.all([
      supabase.from('ingredients').select('recipe_id').ilike('text', `%${term}%`),
      supabase.from('ingredients').select('recipe_id').ilike('name', `%${term}%`),
      supabase.from('recipes').select('id').eq('user_id', userId).ilike('title', `%${term}%`),
      supabase.from('recipes').select('id').eq('user_id', userId).ilike('description', `%${term}%`),
      supabase.from('recipes').select('id').eq('user_id', userId).ilike('cuisine', `%${term}%`),
    ]);
    const matchingIds = [...new Set([
      ...(ingText.data || []).map((r) => r.recipe_id),
      ...(ingName.data || []).map((r) => r.recipe_id),
      ...(titleRows.data || []).map((r) => r.id),
      ...(descRows.data || []).map((r) => r.id),
      ...(cuisineRows.data || []).map((r) => r.id),
    ])];
    dbQuery = dbQuery.in('id', matchingIds.length > 0 ? matchingIds : ['no-match']);
  }

  if (collectionId) {
    const { data: ids } = await supabase
      .from('recipe_collections')
      .select('recipe_id')
      .eq('collection_id', collectionId);
    const recipeIds = (ids || []).map((r) => r.recipe_id);
    dbQuery = dbQuery.in('id', recipeIds.length > 0 ? recipeIds : ['no-match']);
  }

  if (tags) {
    const tagNames = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagNames.length > 0) {
      const { data: tagRows } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .in('name', tagNames);
      const tagIds = (tagRows || []).map((t) => t.id);
      const { data: rtRows } = await supabase
        .from('recipe_tags')
        .select('recipe_id')
        .in('tag_id', tagIds);
      const recipeIds = [...new Set((rtRows || []).map((r) => r.recipe_id))];
      dbQuery = dbQuery.in('id', recipeIds.length > 0 ? recipeIds : ['no-match']);
    }
  }

  const { data, count, error } = await dbQuery;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ data: data || [], total: count || 0, page, pageSize, hasMore: (count || 0) > offset + pageSize });
});

// GET /api/recipes/:id
recipesRouter.get('/:id', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const recipe = await fetchFullRecipe(req.params.id, userId);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ recipe });
});

// DELETE /api/recipes/:id
recipesRouter.delete('/:id', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// PATCH /api/recipes/:id (update title, tags)
recipesRouter.patch('/:id', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const schema = z.object({ title: z.string().min(1).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { error } = await supabase
    .from('recipes')
    .update(parsed.data)
    .eq('id', req.params.id)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  const recipe = await fetchFullRecipe(req.params.id, userId);
  res.json({ recipe });
});

async function fetchFullRecipe(recipeId: string, userId: string) {
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();
  if (!recipe) return null;

  const [{ data: ingredients }, { data: steps }, { data: nutritionalInfo }, { data: tagRows }] = await Promise.all([
    supabase.from('ingredients').select('*').eq('recipe_id', recipeId).order('sort_order'),
    supabase.from('steps').select('*').eq('recipe_id', recipeId).order('order_num'),
    supabase.from('nutritional_info').select('*').eq('recipe_id', recipeId).maybeSingle(),
    supabase
      .from('recipe_tags')
      .select('tags(name)')
      .eq('recipe_id', recipeId),
  ]);

  return {
    ...recipe,
    ingredients: ingredients || [],
    steps: steps || [],
    nutritionalInfo: nutritionalInfo || undefined,
    tags: (tagRows || []).map((r: { tags: { name: string } | null }) => r.tags?.name).filter(Boolean),
  };
}
