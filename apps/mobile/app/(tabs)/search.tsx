import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '@/src/services/api';
import { RecipeCard } from '@/src/components/RecipeCard';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography } from '@/src/lib/theme';
import { useDebounce } from '@/src/hooks/useDebounce';

type Recipe = { id: string; title: string; image_url?: string; total_time_minutes?: number; servings?: number; cuisine?: string };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['recipes', 'search', debouncedQuery],
    queryFn: () => recipesApi.list({ query: debouncedQuery || undefined }),
    enabled: true,
  });

  const recipes = (data?.data || []) as Recipe[];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          placeholder="Search recipes, ingredients, cuisine..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.text3} />}
          rightIcon={query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.text3} />
            </TouchableOpacity>
          ) : undefined}
        />
      </View>

      {isLoading && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}

      {!isLoading && recipes.length === 0 && query.length > 0 && (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptyBody}>Try a different search term or import a new recipe</Text>
        </View>
      )}

      {!isLoading && recipes.length === 0 && query.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>Find any recipe</Text>
          <Text style={styles.emptyBody}>Search by title, ingredient, or cuisine</Text>
        </View>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
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
  header: { padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  title: { ...typography.displaySm, color: colors.text0 },
  list: { paddingHorizontal: spacing.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { ...typography.titleLg, color: colors.text1, textAlign: 'center' },
  emptyBody: { ...typography.bodyMd, color: colors.text2, textAlign: 'center' },
});
