import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function makeChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // make each function return the chain
  for (const key of Object.keys(chain)) {
    if (typeof chain[key] === 'function' && !['maybeSingle', 'single'].includes(key)) {
      (chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    }
  }
  return chain;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    const chain = makeChain({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('returns 201 with token on success', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // email check — not found
        return makeChain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
      }
      // insert
      return makeChain({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-uuid', email: 'a@b.com', created_at: new Date().toISOString() },
          error: null,
        }),
      });
    });

    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@b.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for unknown email', async () => {
    mockFrom.mockReturnValue(makeChain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }));
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    mockFrom.mockReturnValue(makeChain({
      maybeSingle: vi.fn().mockResolvedValue({
        // bcrypt hash of 'correctpassword'
        data: { id: 'uid', email: 'x@y.com', password_hash: '$2a$12$invaliddoesnotmatch000000000000000000000000000000000', created_at: '' },
        error: null,
      }),
    }));
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});
