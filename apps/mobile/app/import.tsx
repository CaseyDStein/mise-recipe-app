import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '@/src/services/api';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius } from '@/src/lib/theme';

const EXAMPLE_URLS = [
  'https://www.allrecipes.com/recipe/...',
  'https://www.foodnetwork.com/recipes/...',
  'https://www.seriouseats.com/...',
  'https://www.bonappetit.com/recipe/...',
];

export default function ImportScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: () => recipesApi.import(url.trim()),
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      const recipe = (data as { recipe: { id: string } }).recipe;
      router.replace(`/recipe/${recipe.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleImport() {
    setError('');
    if (!url.trim()) return setError('Please enter a recipe URL');
    try { new URL(url.trim()); } catch { return setError('Please enter a valid URL'); }
    importMutation.mutate();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={colors.text1} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Import Recipe</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="link" size={36} color={colors.accent} />
            </View>
            <Text style={styles.heroTitle}>Paste any recipe URL</Text>
            <Text style={styles.heroBody}>
              We'll automatically extract the ingredients, steps, and nutritional info — nothing else.
            </Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              placeholder="https://..."
              value={url}
              onChangeText={(t) => { setUrl(t); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleImport}
              leftIcon={<Ionicons name="globe-outline" size={18} color={colors.text3} />}
              rightIcon={url ? (
                <TouchableOpacity onPress={() => setUrl('')}>
                  <Ionicons name="close-circle" size={18} color={colors.text3} />
                </TouchableOpacity>
              ) : undefined}
              error={error}
            />
            <Button label={importMutation.isPending ? 'Importing...' : 'Import Recipe'} onPress={handleImport} loading={importMutation.isPending} size="lg" />
          </View>

          {importMutation.isPending && (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.accent} />
              <View>
                <Text style={styles.loadingTitle}>Fetching recipe...</Text>
                <Text style={styles.loadingBody}>Extracting ingredients and steps</Text>
              </View>
            </View>
          )}

          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Works with any recipe site</Text>
            {EXAMPLE_URLS.map((u) => (
              <View key={u} style={styles.exampleRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.exampleText}>{u}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarTitle: { ...typography.titleLg, color: colors.text0 },
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  heroIcon: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { ...typography.displaySm, color: colors.text0, textAlign: 'center' },
  heroBody: { ...typography.bodyLg, color: colors.text2, textAlign: 'center', lineHeight: 26 },
  inputSection: { gap: spacing.md },
  loadingCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    backgroundColor: colors.bg2, borderRadius: radius.lg, padding: spacing.md,
  },
  loadingTitle: { ...typography.titleSm, color: colors.text0 },
  loadingBody: { ...typography.bodySm, color: colors.text2 },
  examples: { gap: spacing.sm },
  examplesTitle: { ...typography.titleSm, color: colors.text2, marginBottom: spacing.xs },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exampleText: { ...typography.bodySm, color: colors.text3, flex: 1 },
});
