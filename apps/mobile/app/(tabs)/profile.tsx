import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { recipesApi, collectionsApi } from '@/src/services/api';
import { colors, spacing, typography, radius } from '@/src/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: () => recipesApi.list() });
  const { data: collections } = useQuery({ queryKey: ['collections'], queryFn: collectionsApi.list });

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const stats = [
    { label: 'Recipes', value: recipes?.total ?? 0, icon: 'restaurant-outline' as const },
    { label: 'Collections', value: (collections?.data ?? []).length, icon: 'folder-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={22} color={colors.accent} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text3} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Mise v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  container: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.displayMd, color: colors.accent },
  email: { ...typography.bodyLg, color: colors.text1 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.bg2, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', gap: spacing.xs,
  },
  statValue: { ...typography.displaySm, color: colors.text0 },
  statLabel: { ...typography.bodySm, color: colors.text2 },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.text3 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg2, borderRadius: radius.md, padding: spacing.md,
  },
  menuItemText: { ...typography.bodyLg, color: colors.text1 },
  version: { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 'auto' },
});
