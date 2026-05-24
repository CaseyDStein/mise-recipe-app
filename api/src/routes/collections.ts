import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

export const collectionsRouter = Router();
collectionsRouter.use(requireAuth);

const collectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// GET /api/collections
collectionsRouter.get('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { data, error } = await supabase
    .from('collections')
    .select('*, recipe_collections(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: data || [] });
});

// POST /api/collections
collectionsRouter.post('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = collectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, ...parsed.data })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ collection: data });
});

// PATCH /api/collections/:id
collectionsRouter.patch('/:id', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = collectionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { data, error } = await supabase
    .from('collections')
    .update(parsed.data)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ collection: data });
});

// DELETE /api/collections/:id
collectionsRouter.delete('/:id', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// POST /api/collections/:id/recipes
collectionsRouter.post('/:id/recipes', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const schema = z.object({ recipeId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  // Verify collection belongs to user
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const { error } = await supabase
    .from('recipe_collections')
    .upsert({ recipe_id: parsed.data.recipeId, collection_id: req.params.id });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

// DELETE /api/collections/:id/recipes/:recipeId
collectionsRouter.delete('/:id/recipes/:recipeId', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const { error } = await supabase
    .from('recipe_collections')
    .delete()
    .eq('recipe_id', req.params.recipeId)
    .eq('collection_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});
