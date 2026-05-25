import { create } from 'zustand';
import { saveAuth, clearAuth, loadAuth, StoredUser } from '@/src/lib/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
}

async function authRequest(path: string, body: { email: string; password: string }) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as { token: string; user: StoredUser };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  hydrate: async () => {
    const stored = await loadAuth();
    set({ user: stored?.user ?? null, token: stored?.token ?? null, loading: false });
  },

  signIn: async (email, password) => {
    const { token, user } = await authRequest('/api/auth/login', { email, password });
    await saveAuth(token, user);
    set({ token, user });
  },

  signUp: async (email, password) => {
    const { token, user } = await authRequest('/api/auth/register', { email, password });
    await saveAuth(token, user);
    set({ token, user });
  },

  signOut: async () => {
    await clearAuth();
    set({ user: null, token: null });
  },

  updateProfile: async (firstName, lastName) => {
    const { token, user } = get();
    if (!token || !user) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName, lastName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');

    const updatedUser = { ...user, firstName: data.user.firstName, lastName: data.user.lastName };
    await saveAuth(token, updatedUser);
    set({ user: updatedUser });
  },
}));
