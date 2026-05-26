import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/src/stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/src/lib/theme';

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
    // mise://import?url=<encoded> — expo-router handles navigation for this scheme,
    // but we still need to parse it for the warm-start listener case.
    if (raw.startsWith('mise://')) {
      return new URL(raw).searchParams.get('url');
    }
    // Direct http/https — from Android ACTION_SEND shared text.
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    // Shared text that contains a URL somewhere inside it.
    const match = raw.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

function ShareHandler() {
  const { user, loading } = useAuthStore();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  // Track whether we've already processed the cold-start URL so we don't
  // re-fire it when user/loading change after the initial check.
  const coldStartHandled = useRef(false);

  useEffect(() => {
    // Cold start — app was opened by a share or deep link.
    Linking.getInitialURL().then((raw) => {
      if (!raw || coldStartHandled.current) return;
      coldStartHandled.current = true;
      // expo-router already navigates for mise:// on cold start; skip to avoid
      // double navigation. We only need to handle raw http/https from ACTION_SEND.
      if (raw.startsWith('mise://')) return;
      const url = extractRecipeUrl(raw);
      if (url) setPendingUrl(url);
    });

    // Warm start — app was already running when a new share/link arrives.
    const sub = Linking.addEventListener('url', ({ url: raw }) => {
      const url = extractRecipeUrl(raw);
      if (url) setPendingUrl(url);
    });

    return () => sub.remove();
  }, []);

  // Navigate once auth is hydrated and a URL is waiting.
  useEffect(() => {
    if (!loading && user && pendingUrl) {
      router.push(`/import?url=${encodeURIComponent(pendingUrl)}`);
      setPendingUrl(null);
    }
  }, [loading, user, pendingUrl]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
        <ShareHandler />
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg1 } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
