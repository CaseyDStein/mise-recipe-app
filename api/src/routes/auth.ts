import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const profileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

function formatUser(user: { id: string; email: string; created_at: string; first_name?: string | null; last_name?: string | null }) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    firstName: user.first_name ?? undefined,
    lastName: user.last_name ?? undefined,
  };
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email and password (min 8 chars) required' });

  const { email, password, firstName, lastName } = parsed.data;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName?.trim() || null,
      last_name: lastName?.trim() || null,
    })
    .select('id, email, created_at, first_name, last_name')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create account' });

  res.status(201).json({ token: signToken(user.id), user: formatUser(user) });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email and password required' });

  const { email, password } = parsed.data;

  const { data: user } = await supabase
    .from('users')
    .select('id, email, password_hash, created_at, first_name, last_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  // Constant-time comparison — don't reveal whether email exists
  const hash = user?.password_hash ?? '$2a$12$invalidhashpadding000000000000000000000000000000000000';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password' });

  res.json({ token: signToken(user.id), user: formatUser(user) });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at, first_name, last_name')
    .eq('id', userId)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: formatUser(user) });
});

// PATCH /api/auth/profile
authRouter.patch('/profile', requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data' });

  const updates: { first_name?: string; last_name?: string } = {};
  if (parsed.data.firstName !== undefined) updates.first_name = parsed.data.firstName.trim() || null as any;
  if (parsed.data.lastName !== undefined) updates.last_name = parsed.data.lastName.trim() || null as any;

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, created_at, first_name, last_name')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update profile' });

  res.json({ user: formatUser(user) });
});
