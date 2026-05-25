import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsApi } from '@/src/services/api';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius, shadows } from '@/src/lib/theme';
import { useAuthStore } from '@/src/stores/authStore';

type Collection = { id: string; name: string; description?: string; recipe_collections: { count: number }[] };

export default function CollectionsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsApi.list,
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => collectionsApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setShowCreate(false);
      setName('');
      setDescription('');
    },
  });

  const collections = (data?.data || []) as Collection[];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color={colors.text0} />
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}

      {!isLoading && collections.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={56} color={colors.text3} />
          <Text style={styles.emptyTitle}>No collections yet</Text>
          <Text style={styles.emptyBody}>Create collections to organize your recipes by theme, occasion, or anything you like</Text>
          <Button label="Create Collection" onPress={() => setShowCreate(true)} />
        </View>
      )}

      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const count = item.recipe_collections?.[0]?.count ?? 0;
          return (
            <TouchableOpacity
              style={styles.collectionCard}
              onPress={() => router.push({ pathname: '/search', params: { collectionId: item.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.collectionIcon}>
                <Ionicons name="folder" size={28} color={colors.accent} />
              </View>
              <Text style={styles.collectionName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.collectionCount}>{count} {count === 1 ? 'recipe' : 'recipes'}</Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              label="Name" placeholder="e.g. Weeknight Dinners"
              value={name} onChangeText={setName} autoFocus
            />
            <TextInput
              label="Description (optional)" placeholder="What's this collection for?"
              value={description} onChangeText={setDescription} multiline numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowCreate(false)} variant="secondary" style={{ flex: 1 }} />
              <Button
                label="Create" onPress={() => createMutation.mutate()}
                loading={createMutation.isPending} disabled={!name.trim()} style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { ...typography.displaySm, color: colors.text0 },
  addButton: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.md },
  collectionCard: {
    flex: 1, backgroundColor: colors.bg2, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, ...shadows.sm,
  },
  collectionIcon: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  collectionName: { ...typography.titleMd, color: colors.text0 },
  collectionCount: { ...typography.bodySm, color: colors.text2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { ...typography.titleLg, color: colors.text1, textAlign: 'center' },
  emptyBody: { ...typography.bodyMd, color: colors.text2, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay50 },
  modalSheet: {
    backgroundColor: colors.bg2, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingTop: spacing.md, gap: spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg4,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.displaySm, color: colors.text0 },
  modalActions: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
});
