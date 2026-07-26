import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  photo: string;
  title: string;
  joinedCount: string;
  day: number;
  totalDays: number;
  onPressJoin?: () => void;
};

export default function FeaturedChallengeCard({ photo, title, joinedCount, day, totalDays, onPressJoin }: Props) {
  const progress = day / totalDays;

  return (
    <View style={styles.card}>
      <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>{title} {'\u{1F525}'}</Text>
        <Text style={styles.joined}>Join {joinedCount} others</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>Day {day} of {totalDays}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onPressJoin} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Join Challenge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,14,30,0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  joined: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  progressRow: {
    marginTop: spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
