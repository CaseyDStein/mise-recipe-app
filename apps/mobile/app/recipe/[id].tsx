import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '@/src/services/api';
import { colors, spacing, typography, radius, shadows } from '@/src/lib/theme';

const PLACEHOLDER = require('../../assets/recipe-placeholder.png');

type Ingredient = { id: string; text: string; quantity?: string; unit?: string };
type Step = { id: string; order_num: number; text: string };
type NutritionalInfo = {
  calories?: number; protein_g?: number; total_carbs_g?: number;
  total_fat_g?: number; sodium_mg?: number; dietary_fiber_g?: number;
  servings?: number; serving_size?: string;
};
type Recipe = {
  id: string; title: string; source_url: string; image_url?: string;
  description?: string; prep_time_minutes?: number; cook_time_minutes?: number;
  total_time_minutes?: number; servings?: number; cuisine?: string; category?: string;
  ingredients: Ingredient[]; steps: Step[]; nutritionalInfo?: NutritionalInfo; tags?: string[];
};

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.get(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => recipesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      router.back();
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const recipe = (data as { recipe: Recipe })?.recipe;
  if (!recipe) return null;

  function toggleStep(orderNum: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.has(orderNum) ? next.delete(orderNum) : next.add(orderNum);
      return next;
    });
  }

  function handleDelete() {
    Alert.alert('Delete Recipe', `Delete "${recipe.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  const times = [
    recipe.prep_time_minutes && { label: 'Prep', value: formatTime(recipe.prep_time_minutes) },
    recipe.cook_time_minutes && { label: 'Cook', value: formatTime(recipe.cook_time_minutes) },
    recipe.total_time_minutes && { label: 'Total', value: formatTime(recipe.total_time_minutes) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header image */}
        <View style={styles.imageContainer}>
          <Image
            source={recipe.image_url ? { uri: recipe.image_url } : PLACEHOLDER}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text0} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title & meta */}
          <View style={styles.titleSection}>
            {recipe.cuisine && (
              <View style={styles.cuisineChip}>
                <Text style={styles.cuisineChipText}>{recipe.cuisine}</Text>
              </View>
            )}
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}
          </View>

          {/* Time & servings row */}
          {(times.length > 0 || recipe.servings) && (
            <View style={styles.statsRow}>
              {times.map((t) => (
                <View key={t.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{t.value}</Text>
                  <Text style={styles.statLabel}>{t.label}</Text>
                </View>
              ))}
              {recipe.servings && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{recipe.servings}</Text>
                  <Text style={styles.statLabel}>Servings</Text>
                </View>
              )}
            </View>
          )}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ing, idx) => (
                  <View key={ing.id ?? idx} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>{ing.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <View style={styles.stepsList}>
                {recipe.steps.map((step) => {
                  const done = completedSteps.has(step.order_num);
                  return (
                    <TouchableOpacity
                      key={step.id ?? step.order_num}
                      style={[styles.stepCard, done && styles.stepCardDone]}
                      onPress={() => toggleStep(step.order_num)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.stepNumber, done && styles.stepNumberDone]}>
                        {done
                          ? <Ionicons name="checkmark" size={14} color={colors.text0} />
                          : <Text style={styles.stepNumberText}>{step.order_num}</Text>
                        }
                      </View>
                      <Text style={[styles.stepText, done && styles.stepTextDone]}>{step.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Nutritional info */}
          {recipe.nutritionalInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition</Text>
              {recipe.nutritionalInfo.serving_size && (
                <Text style={styles.servingSize}>Per {recipe.nutritionalInfo.serving_size}</Text>
              )}
              <View style={styles.nutritionGrid}>
                {[
                  { label: 'Calories', value: recipe.nutritionalInfo.calories, unit: '' },
                  { label: 'Protein', value: recipe.nutritionalInfo.protein_g, unit: 'g' },
                  { label: 'Carbs', value: recipe.nutritionalInfo.total_carbs_g, unit: 'g' },
                  { label: 'Fat', value: recipe.nutritionalInfo.total_fat_g, unit: 'g' },
                  { label: 'Fiber', value: recipe.nutritionalInfo.dietary_fiber_g, unit: 'g' },
                  { label: 'Sodium', value: recipe.nutritionalInfo.sodium_mg, unit: 'mg' },
                ].filter((n) => n.value != null).map((n) => (
                  <View key={n.label} style={styles.nutritionCard}>
                    <Text style={styles.nutritionValue}>{Math.round(n.value!)}{n.unit}</Text>
                    <Text style={styles.nutritionLabel}>{n.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Source link */}
          <View style={styles.sourceRow}>
            <Ionicons name="link-outline" size={14} color={colors.text3} />
            <Text style={styles.sourceText} numberOfLines={1}>{recipe.source_url}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  loading: { flex: 1, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { position: 'relative', height: 280 },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: spacing.lg, left: spacing.lg,
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.overlay50, alignItems: 'center', justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.overlay50, alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: spacing.lg, gap: spacing.xl },
  titleSection: { gap: spacing.sm },
  cuisineChip: {
    alignSelf: 'flex-start', backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full,
  },
  cuisineChipText: { ...typography.caption, color: colors.accent, fontWeight: '700' },
  title: { ...typography.displayMd, color: colors.text0 },
  description: { ...typography.bodyLg, color: colors.text2, lineHeight: 26 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.bg2, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', gap: 2,
  },
  statValue: { ...typography.titleLg, color: colors.text0 },
  statLabel: { ...typography.caption, color: colors.text2 },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.titleLg, color: colors.text0 },
  ingredientsList: { gap: spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  ingredientDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent, marginTop: 7,
  },
  ingredientText: { ...typography.bodyLg, color: colors.text1, flex: 1, lineHeight: 26 },
  stepsList: { gap: spacing.md },
  stepCard: {
    flexDirection: 'row', gap: spacing.md, backgroundColor: colors.bg2,
    borderRadius: radius.lg, padding: spacing.md, ...shadows.sm,
  },
  stepCardDone: { opacity: 0.6 },
  stepNumber: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  stepNumberDone: { backgroundColor: colors.success },
  stepNumberText: { ...typography.titleSm, color: colors.text0 },
  stepText: { ...typography.bodyLg, color: colors.text1, flex: 1, lineHeight: 26 },
  stepTextDone: { textDecorationLine: 'line-through', color: colors.text3 },
  servingSize: { ...typography.bodyMd, color: colors.text2, marginBottom: spacing.xs },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  nutritionCard: {
    backgroundColor: colors.bg2, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', minWidth: '28%', gap: 2,
  },
  nutritionValue: { ...typography.titleLg, color: colors.text0 },
  nutritionLabel: { ...typography.caption, color: colors.text2 },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  sourceText: { ...typography.bodySm, color: colors.text3, flex: 1 },
});
