import { useEffect, useRef, useState } from 'react';
import { AppState, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/src/stores/authStore';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColors } from '@/src/lib/theme';
import { initAds } from '@/src/lib/ads';
import { getSharedUrl, addSharedUrlListener } from '../modules/share-intent/src';
import { recipesApi } from '@/src/services/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 } },
});

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}

function AdsInitializer() {
  useEffect(() => { initAds(); }, []);
  return null;
}

function extractRecipeUrl(raw: string): string | null {
  try {
    if (raw.startsWith('therecipeorganizer://')) {
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
  // Tracks URLs queued this session to prevent the App Group + Linking double-fire
  const processedUrls = useRef(new Set<string>());
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (url: string) => recipesApi.import(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      router.replace('/(tabs)');
    },
    onError: (e: Error) => {
      Alert.alert('Import failed', e.message ?? 'Could not import the recipe.');
    },
  });

  function queueUrl(url: string | null | undefined) {
    if (!url) return;
    const extracted = extractRecipeUrl(url);
    if (!extracted) return;
    if (processedUrls.current.has(extracted)) return; // already queued from another source
    processedUrls.current.add(extracted);
    setPendingUrl(extracted);
  }

  useEffect(() => {
    // Android: read Intent.EXTRA_TEXT from the launching intent
    // iOS: read URL saved by the Share Extension in App Group UserDefaults
    getSharedUrl().then(queueUrl).catch(() => {});

    // Catches deep links (Android share intents surfaced via Linking, or other URL scheme links).
    Linking.getInitialURL().then((raw) => {
      if (!raw || coldStartHandled.current) return;
      coldStartHandled.current = true;
      queueUrl(raw);
    });

    const linkSub = Linking.addEventListener('url', ({ url: raw }) => queueUrl(raw));
    const shareSub = addSharedUrlListener((url) => queueUrl(url));

    // iOS: Share Extension saves the URL to App Group UserDefaults without opening the app,
    // so we read UserDefaults whenever the app returns to foreground.
    const stateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') getSharedUrl().then(queueUrl).catch(() => {});
    });

    return () => {
      linkSub.remove();
      shareSub.remove();
      stateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!loading && user && pendingUrl && !importMutation.isPending) {
      const url = pendingUrl;
      setPendingUrl(null);
      importMutation.mutate(url);
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
        <AdsInitializer />
        <ShareHandler />
        <StatusBar style="auto" />
        <ThemedStack />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
