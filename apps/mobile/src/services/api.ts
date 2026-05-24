import { supabase } from '@/src/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...(options?.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Recipes
export const recipesApi = {
  import: (url: string) =>
    apiFetch<{ recipe: unknown }>('/api/recipes/import', { method: 'POST', body: JSON.stringify({ url }) }),

  list: (params?: { query?: string; collectionId?: string; tags?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.query) qs.set('query', params.query);
    if (params?.collectionId) qs.set('collectionId', params.collectionId);
    if (params?.tags) qs.set('tags', params.tags);
    if (params?.page) qs.set('page', String(params.page));
    return apiFetch<{ data: unknown[]; total: number; hasMore: boolean }>(`/api/recipes?${qs}`);
  },

  get: (id: string) => apiFetch<{ recipe: unknown }>(`/api/recipes/${id}`),

  delete: (id: string) => apiFetch<void>(`/api/recipes/${id}`, { method: 'DELETE' }),

  patch: (id: string, data: { title?: string }) =>
    apiFetch<{ recipe: unknown }>(`/api/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Collections
export const collectionsApi = {
  list: () => apiFetch<{ data: unknown[] }>('/api/collections'),
  create: (data: { name: string; description?: string }) =>
    apiFetch<{ collection: unknown }>('/api/collections', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/collections/${id}`, { method: 'DELETE' }),
  addRecipe: (collectionId: string, recipeId: string) =>
    apiFetch<void>(`/api/collections/${collectionId}/recipes`, { method: 'POST', body: JSON.stringify({ recipeId }) }),
  removeRecipe: (collectionId: string, recipeId: string) =>
    apiFetch<void>(`/api/collections/${collectionId}/recipes/${recipeId}`, { method: 'DELETE' }),
};

// Tags
export const tagsApi = {
  list: () => apiFetch<{ data: unknown[] }>('/api/tags'),
  addToRecipe: (recipeId: string, tagName: string) =>
    apiFetch<void>('/api/tags/recipe', { method: 'POST', body: JSON.stringify({ recipeId, tagName }) }),
  removeFromRecipe: (recipeId: string, tagName: string) =>
    apiFetch<void>('/api/tags/recipe', { method: 'DELETE', body: JSON.stringify({ recipeId, tagName }) }),
};
