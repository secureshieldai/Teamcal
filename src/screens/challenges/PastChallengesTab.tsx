import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../../theme';
import { useChallenges } from '../../hooks/useChallenges';
import { challengesService } from '../../services/api/challenges.service';
import { challengeTypes } from '../../data/challengesData';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const MEDAL_COLORS: Record<number, string> = { 1: '#FFC542', 2: '#C0C0C0', 3: '#CD7F32' };

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function PastChallengesTab({ navigation }: Props) {
  const { challenges, loading, refetch } = useChallenges('completed');
  const { user } = useAuth();
  const [ranks, setRanks] = useState<Record<string, { place: number; total: number }>>({});

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        challenges.map(async (c) => {
          try {
            const members = await challengesService.getMembers(c.id);
            const idx = members.findIndex((m) => m.id === user?.id);
            return [c.id, { place: idx >= 0 ? idx + 1 : 0, total: members.length }] as const;
          } catch {
            return [c.id, { place: 0, total: 0 }] as const;
          }
        })
      );
      if (!cancelled) setRanks(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [challenges, user?.id]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Completed Challenges</Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
      {!loading && challenges.length === 0 && <Text style={styles.emptyText}>No completed challenges yet.</Text>}

      <View style={{ gap: spacing.md }}>
        {challenges.map((challenge) => {
          const rank = ranks[challenge.id];
          const unit = challenge.goal_unit || challengeTypes.find((t) => t.id === challenge.challenge_type)?.unit || 'days';
          const total = challenge.goal_target ?? challenge.total_days;
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
                <Text style={styles.dateRange}>
                  {challenge.starts_at ? new Date(challenge.starts_at).toLocaleDateString() : ''}
                  {challenge.ends_at ? ` – ${new Date(challenge.ends_at).toLocaleDateString()}` : ''}
                </Text>
                {rank && rank.place > 0 && (
                  <View style={styles.rankRow}>
                    <Ionicons name="medal" size={13} color={MEDAL_COLORS[rank.place] || colors.primary} />
                    <Text style={styles.rankText}>
                      {ordinal(rank.place)} of {rank.total}
                    </Text>
                  </View>
                )}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
                <Text style={styles.metricText}>
                  {total.toLocaleString()} {unit}
                </Text>
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  card: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radii.lg, backgroundColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  dateRange: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  rankText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  metricText: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
});
