import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
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
