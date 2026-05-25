import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { recipesApi, tagsApi } from '@/src/services/api';
import { RecipeCard } from '@/src/components/RecipeCard';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius } from '@/src/lib/theme';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useAuthStore } from '@/src/stores/authStore';

type Recipe = { id: string; title: string; image_url?: string; total_time_minutes?: number; servings?: number; cuisine?: string };
type Tag = { id: string; name: string; recipe_tags: { count: number }[] };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const token = useAuthStore((s) => s.token);

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.list,
    enabled: !!token,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['recipes', 'search', debouncedQuery, selectedTag],
    queryFn: () => recipesApi.list({
      query: debouncedQuery || undefined,
      tags: selectedTag ?? undefined,
    }),
    enabled: !!token,
  });

  const tags = (tagsData?.data || []) as Tag[];
  const recipes = (data?.data || []) as Recipe[];

  const isFiltering = query.length > 0 || selectedTag !== null;
  const isEmpty = !isLoading && recipes.length === 0;

  function toggleTag(name: string) {
    setSelectedTag((prev) => (prev === name ? null : name));
  }

  function clearAll() {
    setQuery('');
    setSelectedTag(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Search</Text>

            <TextInput
              placeholder="Search recipes, cuisine..."
              value={query}
              onChangeText={(t) => { setQuery(t); }}
              autoCapitalize="none"
              returnKeyType="search"
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.text3} />}
              rightIcon={query ? (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.text3} />
                </TouchableOpacity>
              ) : undefined}
            />

            {tags.length > 0 && (
              <View style={styles.tagsSection}>
                <View style={styles.tagsHeader}>
                  <Text style={styles.tagsLabel}>Tags</Text>
                  {selectedTag && (
                    <TouchableOpacity onPress={() => setSelectedTag(null)}>
                      <Text style={styles.clearLink}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsList}
                >
                  {tags.map((tag) => {
                    const active = selectedTag === tag.name;
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                        onPress={() => toggleTag(tag.name)}
                        activeOpacity={0.75}
                      >
                        {active && <Ionicons name="checkmark" size={12} color={colors.text0} style={styles.tagCheck} />}
                        <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                          {tag.name}
                        </Text>
                        <Text style={[styles.tagCount, active && styles.tagCountActive]}>
                          {tag.recipe_tags?.[0]?.count ?? 0}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {isFiltering && !isLoading && (
              <View style={styles.resultsRow}>
                <Text style={styles.resultsText}>
                  {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
                  {selectedTag ? ` tagged "${selectedTag}"` : ''}
                  {query ? ` matching "${query}"` : ''}
                </Text>
                <TouchableOpacity onPress={clearAll}>
                  <Text style={styles.clearLink}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}

            {isLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

            {isEmpty && isFiltering && (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={colors.text3} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyBody}>Try a different search or tag</Text>
              </View>
            )}

            {isEmpty && !isFiltering && tags.length > 0 && (
              <View style={styles.empty}>
                <Ionicons name="pricetag-outline" size={48} color={colors.text3} />
                <Text style={styles.emptyTitle}>Filter by tag</Text>
                <Text style={styles.emptyBody}>Tap a tag above, or type to search</Text>
              </View>
            )}

            {isEmpty && !isFiltering && tags.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={48} color={colors.text3} />
                <Text style={styles.emptyTitle}>Find any recipe</Text>
                <Text style={styles.emptyBody}>Search by title or cuisine</Text>
              </View>
            )}

            {recipes.length > 0 && <View style={styles.recipeListSpacer} />}
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
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  header: { paddingTop: spacing.md, gap: spacing.md },
  title: { ...typography.displaySm, color: colors.text0 },
  list: { padding: spacing.lg, paddingTop: spacing.md },

  tagsSection: { gap: spacing.sm },
  tagsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagsLabel: { ...typography.label, color: colors.text3 },
  clearLink: { ...typography.titleSm, color: colors.accent },
  tagsList: { gap: spacing.sm, paddingRight: spacing.lg },

  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.bg4,
  },
  tagChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tagCheck: { marginRight: 1 },
  tagChipText: { ...typography.titleSm, color: colors.text2 },
  tagChipTextActive: { color: colors.text0 },
  tagCount: {
    ...typography.caption,
    color: colors.text3,
    backgroundColor: colors.bg4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  tagCountActive: { color: colors.accentMuted, backgroundColor: 'rgba(255,255,255,0.2)' },

  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsText: { ...typography.bodySm, color: colors.text2 },

  loader: { marginTop: spacing.xl },
  recipeListSpacer: { height: spacing.md },

  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyTitle: { ...typography.titleLg, color: colors.text1, textAlign: 'center' },
  emptyBody: { ...typography.bodyMd, color: colors.text2, textAlign: 'center' },
});
