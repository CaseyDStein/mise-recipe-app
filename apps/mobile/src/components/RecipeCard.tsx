import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/src/lib/theme';

const PLACEHOLDER = require('../../../assets/recipe-placeholder.png');

interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  totalTimeMinutes?: number;
  servings?: number;
  cuisine?: string;
  tags?: string[];
  onPress: () => void;
}

export function RecipeCard({ title, imageUrl, totalTimeMinutes, servings, cuisine, onPress }: RecipeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={imageUrl ? { uri: imageUrl } : PLACEHOLDER}
          style={styles.image}
          resizeMode="cover"
        />
        {totalTimeMinutes && (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={11} color={colors.text1} />
            <Text style={styles.timeBadgeText}>{formatTime(totalTimeMinutes)}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.meta}>
          {cuisine && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{cuisine}</Text>
            </View>
          )}
          {servings && (
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={12} color={colors.text2} />
              <Text style={styles.metaText}>{servings}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageContainer: { position: 'relative', height: 180 },
  image: { width: '100%', height: '100%' },
  timeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.overlay80,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  timeBadgeText: { ...typography.caption, color: colors.text1, fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.xs },
  title: { ...typography.titleMd, color: colors.text0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  metaChipText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...typography.caption, color: colors.text2 },
});
