import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { recipesApi, collectionsApi } from '@/src/services/api';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius } from '@/src/lib/theme';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuthStore();
  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: () => recipesApi.list() });
  const { data: collections } = useQuery({ queryKey: ['collections'], queryFn: collectionsApi.list });

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }, [user?.firstName, user?.lastName]);

  const isDirty = firstName !== (user?.firstName ?? '') || lastName !== (user?.lastName ?? '');

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(firstName, lastName);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const avatarLetter = (user?.firstName?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();

  const stats = [
    { label: 'Recipes', value: recipes?.total ?? 0, icon: 'restaurant-outline' as const },
    { label: 'Collections', value: (collections?.data ?? []).length, icon: 'folder-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
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
            <Text style={styles.sectionTitle}>Profile</Text>
            <TextInput
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={isDirty ? handleSave : undefined}
            />
            {isDirty && (
              <Button label="Save Changes" onPress={handleSave} loading={saving} />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text3} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>The Recipe Organizer v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg1 },
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
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
