import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/src/stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColors } from '@/src/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 } },
});

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}

function extractRecipeUrl(raw: string): string | null {
  try {
    if (raw.startsWith('mise://')) {
      return new URL(raw).searchParams.get('url');
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const match = raw.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

function ShareHandler() {
  const { user, loading } = useAuthStore();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const coldStartHandled = useRef(false);

  useEffect(() => {
    Linking.getInitialURL().then((raw) => {
      if (!raw || coldStartHandled.current) return;
      coldStartHandled.current = true;
      if (raw.startsWith('mise://')) return;
      const url = extractRecipeUrl(raw);
      if (url) setPendingUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url: raw }) => {
      const url = extractRecipeUrl(raw);
      if (url) setPendingUrl(url);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!loading && user && pendingUrl) {
      router.push(`/import?url=${encodeURIComponent(pendingUrl)}`);
      setPendingUrl(null);
    }
  }, [loading, user, pendingUrl]);

  return null;
}

function ThemedStack() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg1 } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="import" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
        <ShareHandler />
        <StatusBar style="auto" />
        <ThemedStack />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
