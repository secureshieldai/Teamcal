import React, { useCallback } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../../theme';
import { useChallenges } from '../../hooks/useChallenges';
import { challengeTypes } from '../../data/challengesData';
import type { Challenge } from '../../types/api';
import type { RootStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

function daysLeft(challenge: Challenge) {
  if (challenge.ends_at) return Math.max(0, Math.ceil((challenge.ends_at - Date.now()) / 86_400_000));
  return Math.max(0, challenge.total_days - (challenge.current_day ?? 0));
}

function unitFor(challenge: Challenge) {
  return challenge.goal_unit || challengeTypes.find((t) => t.id === challenge.challenge_type)?.unit || 'days';
}

export default function MyChallengesTab({ navigation }: Props) {
  const { challenges, loading, refetch } = useChallenges('my');
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.createCard} onPress={() => navigation.navigate('CreateChallenge')} activeOpacity={0.9}>
        <View style={styles.createIcon}>
          <Ionicons name="add" size={26} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.createTitle}>Create Challenge</Text>
          <Text style={styles.createSubtitle}>Start a new challenge and inspire others</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Ongoing Challenges</Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

      {!loading && challenges.length === 0 && (
        <Text style={styles.emptyText}>You haven't joined any challenges yet.</Text>
      )}

      <View style={{ gap: spacing.md }}>
        {challenges.map((challenge) => {
          const total = challenge.goal_target ?? challenge.total_days;
          const current = Math.round(((challenge.current_day ?? 0) / (challenge.total_days || 1)) * total);
          const percent = Math.min(100, Math.round(((challenge.current_day ?? 0) / (challenge.total_days || 1)) * 100));
          return (
            <TouchableOpacity
              key={challenge.id}
              style={[styles.card, shadow.soft]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
            >
              <Image source={{ uri: challenge.photo ?? undefined }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {challenge.title}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{challenge.joined_count}</Text>
                  <Text style={styles.daysLeft}>{daysLeft(challenge)} days left</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.progressText}>
                    {current.toLocaleString()} / {total.toLocaleString()} {unitFor(challenge)}
                  </Text>
                  <Text style={styles.percentText}>{percent}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  createIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  createTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  createSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  card: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  thumb: { width: 68, height: 68, borderRadius: radii.lg, backgroundColor: colors.border },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '600', marginRight: spacing.sm },
  daysLeft: { fontSize: 11.5, color: colors.primary, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  percentText: { fontSize: 10.5, color: colors.textPrimary, fontWeight: '800' },
});
