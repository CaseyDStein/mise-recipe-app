import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '@/src/services/api';
import { RecipeCard } from '@/src/components/RecipeCard';
import { colors, spacing, typography, radius } from '@/src/lib/theme';
import { useAuthStore } from '@/src/stores/authStore';

type Recipe = {
  id: string;
  title: string;
  image_url?: string;
  total_time_minutes?: number;
  servings?: number;
  cuisine?: string;
  tags?: string[];
};

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.list({ page: 1 }),
    enabled: !!user,
  });

  const recipes = (data?.data || []) as Recipe[];
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Hello, {displayName}</Text>
                <Text style={styles.subGreeting}>
                  {recipes.length > 0 ? `${data?.total ?? recipes.length} recipes saved` : 'Start saving recipes'}
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/import')}>
                <Ionicons name="add" size={24} color={colors.text0} />
              </TouchableOpacity>
            </View>

            {recipes.length === 0 && !isLoading && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/import')}>
                <Ionicons name="link-outline" size={48} color={colors.accent} />
                <Text style={styles.emptyTitle}>Add your first recipe</Text>
                <Text style={styles.emptyBody}>Paste any recipe URL and we'll save it for you</Text>
                <View style={styles.emptyChip}>
                  <Text style={styles.emptyChipText}>Import from URL</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                </View>
              </TouchableOpacity>
            )}

            {recipes.length > 0 && <Text style={styles.sectionTitle}>Recent Recipes</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            id={item.id}
            title={item.title}
            imageUrl={item.image_url}
            totalTimeMinutes={item.total_time_minutes}
            servings={item.servings}
            cuisine={item.cuisine}
            tags={item.tags}
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
        ListEmptyComponent={isLoading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  list: { padding: spacing.lg, paddingTop: spacing.md },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { ...typography.displaySm, color: colors.text0 },
  subGreeting: { ...typography.bodyMd, color: colors.text2, marginTop: 2 },
  addButton: {
    width: 48, height: 48, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...typography.titleSm, color: colors.text2, textTransform: 'uppercase', letterSpacing: 1 },
  emptyCard: {
    backgroundColor: colors.bg2, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: colors.bg4, borderStyle: 'dashed',
  },
  emptyTitle: { ...typography.titleLg, color: colors.text0 },
  emptyBody: { ...typography.bodyMd, color: colors.text2, textAlign: 'center' },
  emptyChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.accentMuted, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  emptyChipText: { ...typography.titleSm, color: colors.accent },
});
