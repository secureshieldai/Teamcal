import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { Challenge } from '../../types/api';

type Props = {
  challenge: Challenge;
  onInviteFriends: () => void;
  onViewChallenge: () => void;
};

const CONFETTI = [
  { top: 20, left: 30, color: '#FFC542', size: 10 },
  { top: 50, left: 300, color: '#FF6A2B', size: 8 },
  { top: 90, left: 60, color: '#2ED47A', size: 7 },
  { top: 10, left: 220, color: '#3E7BFA', size: 9 },
  { top: 140, left: 320, color: '#FF4D5E', size: 6 },
  { top: 160, left: 20, color: '#8B5CF6', size: 8 },
];

export default function ChallengeCreatedStep({ challenge, onInviteFriends, onViewChallenge }: Props) {
  return (
    <View style={styles.container}>
      {CONFETTI.map((c, i) => (
        <View key={i} style={[styles.confetti, { top: c.top, left: c.left, backgroundColor: c.color, width: c.size, height: c.size, borderRadius: c.size / 2 }]} />
      ))}

      <View style={styles.trophyCircle}>
        <Ionicons name="trophy" size={56} color="#FFC542" />
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={16} color={colors.white} />
        </View>
      </View>

      <Text style={styles.title}>Challenge Created!</Text>
      <Text style={styles.subtitle}>Your challenge is ready.{'\n'}Let's get people to join!</Text>

      <View style={styles.summaryCard}>
        <Image source={{ uri: challenge.photo ?? undefined }} style={styles.summaryImage} />
        <View style={{ flex: 1 }}>
          <View style={styles.summaryTitleRow}>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {challenge.title}
            </Text>
          </View>
          <View style={styles.summaryMetaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.summaryMetaText}>
              {new Date(challenge.starts_at ?? Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {' – '}
              {challenge.ends_at ? new Date(challenge.ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
            </Text>
          </View>
          <View style={styles.summaryMetaRow}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.summaryMetaText}>{challenge.duration_days} Days</Text>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
            <Text style={styles.summaryMetaText}>{challenge.joined_count} Participant{challenge.joined_count === 1 ? '' : 's'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onInviteFriends} activeOpacity={0.85}>
        <Ionicons name="people-outline" size={17} color={colors.white} />
        <Text style={styles.primaryBtnText}>Invite Friends</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onViewChallenge} activeOpacity={0.85}>
        <Text style={styles.secondaryBtnText}>View Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  confetti: {
    position: 'absolute',
  },
  trophyCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.navy,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.xxl,
    width: '100%',
  },
  summaryImage: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.border },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center' },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  summaryMetaText: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    width: '100%',
    marginTop: spacing.xl,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  secondaryBtnText: { color: colors.navy, fontWeight: '700', fontSize: 14 },
});
