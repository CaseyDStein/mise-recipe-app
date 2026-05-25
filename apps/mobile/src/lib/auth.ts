import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'mise_auth_token';
const USER_KEY = 'mise_auth_user';

export interface StoredUser {
  id: string;
  email: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

export async function saveAuth(token: string, user: StoredUser) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function loadAuth(): Promise<{ token: string; user: StoredUser } | null> {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export async function clearAuth() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
