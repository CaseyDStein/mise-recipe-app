import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useColors } from '@/src/lib/theme';

export default function Index() {
  const colors = useColors();
  const { token, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}
