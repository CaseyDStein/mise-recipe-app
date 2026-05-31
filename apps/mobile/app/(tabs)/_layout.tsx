import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useColors, radius } from '@/src/lib/theme';

export default function TabsLayout() {
  const { token, loading } = useAuthStore();
  const colors = useColors();

  if (!loading && !token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={[styles.tabBarBg, { backgroundColor: colors.bg2, borderTopColor: colors.bg4 }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  tabBarBg: {
    flex: 1,
    borderTopWidth: 1,
  },
});
