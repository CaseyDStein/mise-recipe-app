import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

export const tagsRouter = Router();
tagsRouter.use(requireAuth);

// GET /api/tags
tagsRouter.get('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, recipe_tags(count)')
    .eq('user_id', userId)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: data || [] });
});

// POST /api/tags
tagsRouter.post('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const schema = z.object({ name: z.string().min(1).max(50) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { data, error } = await supabase
    .from('tags')
    .upsert({ user_id: userId, name: parsed.data.name.toLowerCase() }, { onConflict: 'user_id,name' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ tag: data });
});

// POST /api/tags/recipe
tagsRouter.post('/recipe', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const schema = z.object({ recipeId: z.string().uuid(), tagName: z.string().min(1).max(50) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  // Upsert the tag
  const { data: tag, error: tagErr } = await supabase
    .from('tags')
    .upsert({ user_id: userId, name: parsed.data.tagName.toLowerCase() }, { onConflict: 'user_id,name' })
    .select()
    .single();
  if (tagErr) return res.status(500).json({ error: tagErr.message });

  const { error } = await supabase
    .from('recipe_tags')
    .upsert({ recipe_id: parsed.data.recipeId, tag_id: tag.id });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

// DELETE /api/tags/recipe
tagsRouter.delete('/recipe', async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const schema = z.object({ recipeId: z.string().uuid(), tagName: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('user_id', userId)
    .eq('name', parsed.data.tagName.toLowerCase())
    .single();
  if (!tag) return res.status(404).json({ error: 'Tag not found' });

  await supabase.from('recipe_tags').delete().eq('recipe_id', parsed.data.recipeId).eq('tag_id', tag.id);
  res.status(204).send();
});
