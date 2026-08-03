import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService, type TrackerLastNDay } from '../../services/api/tracker.service';
import { useAuth } from '../../context/AuthContext';
import { longestStreak } from '../../data/stepsData';
import MiniLineChart from '../../components/charts/MiniLineChart';
import type { TrackerEntry } from '../../types/api';

interface Achievement {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  unlocked: boolean;
}

export default function StepsTrendsTab() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(320, width - spacing.lg * 2 - spacing.lg * 2);
  const { user } = useAuth();
  const goal = user?.goal_steps ?? 8000;

  const week = useApiQuery(() => trackerService.getLastN('steps', 7), [] as TrackerLastNDay[], []);
  const month = useApiQuery(() => trackerService.getLastN('steps', 30), [] as TrackerLastNDay[], []);
  const days90 = useApiQuery(() => trackerService.getLastN('steps', 90), [] as TrackerLastNDay[], []);
  const entries = useApiQuery(() => trackerService.getEntries('steps', 300), [] as TrackerEntry[], []);

  const weekValues = week.data.map((d) => d.total);
  const weekLabels = week.data.map((d) => {
    const [y, m, day] = d.day.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString([], { weekday: 'narrow' });
  });
  const monthValues = month.data.map((d) => d.total);

  const hasWeekData = weekValues.some((v) => v > 0);
  const hasMonthData = monthValues.some((v) => v > 0);

  const average = weekValues.length ? Math.round(weekValues.reduce((a, b) => a + b, 0) / weekValues.length) : 0;
  const best = weekValues.length ? Math.max(...weekValues) : 0;
  const total30 = monthValues.reduce((a, b) => a + b, 0);
  const goalHits = month.data.filter((d) => d.total >= goal).length;

  const achievements = useMemo<Achievement[]>(() => {
    const morningTotals = new Map<string, number>();
    for (const entry of entries.data) {
      const d = new Date(entry.ts);
      if (d.getHours() >= 12) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      morningTotals.set(key, (morningTotals.get(key) ?? 0) + entry.value);
    }
    const morningMiler = Array.from(morningTotals.values()).some((v) => v >= 3000);
    const weekendWarrior = days90.data.some((d) => d.total >= 20000);
    const steadySeven = longestStreak(days90.data, goal) >= 7;

    return [
      { icon: 'ribbon', title: 'Morning Miler', description: '3,000 steps before noon', unlocked: morningMiler },
      { icon: 'flash', title: 'Weekend Warrior', description: '20k in a single day', unlocked: weekendWarrior },
      { icon: 'radio-button-on', title: 'Steady Seven', description: 'Hit goal 7 days in a row', unlocked: steadySeven },
    ];
  }, [entries.data, days90.data, goal]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>7-DAY TREND</Text>
        {week.loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : week.error ? (
          <Text style={styles.empty}>Unable to load: {week.error}</Text>
        ) : !hasWeekData ? (
          <Text style={styles.empty}>Log some steps this week to see trends.</Text>
        ) : (
          <MiniLineChart values={weekValues} labels={weekLabels} width={chartWidth} height={90} />
        )}
      </View>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.dashedRow}>
          <Text style={styles.sectionLabel}>30-DAY TREND</Text>
          <View style={styles.dashedLine} />
        </View>
        {month.loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : month.error ? (
          <Text style={styles.empty}>Unable to load: {month.error}</Text>
        ) : !hasMonthData ? (
          <Text style={styles.empty}>No data over the last 30 days yet.</Text>
        ) : (
          <MiniLineChart values={monthValues} labels={[]} width={chartWidth} height={90} />
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>7D AVERAGE</Text>
          <Text style={styles.statValue}>{average.toLocaleString()}</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>BEST DAY</Text>
          <Text style={styles.statValue}>{best.toLocaleString()}</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>TOTAL (30D)</Text>
          <Text style={styles.statValue}>{(total30 / 1000).toFixed(1)} <Text style={styles.statUnit}>k</Text></Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>GOAL HITS</Text>
          <Text style={styles.statValue}>{goalHits}/{month.data.length || 30}</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        {achievements.map((a) => (
          <View key={a.title} style={styles.achievementRow}>
            <View style={[styles.achievementIcon, a.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked]}>
              <Ionicons name={a.icon} size={18} color={a.unlocked ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementTitle, !a.unlocked && styles.achievementTitleLocked]}>{a.title}</Text>
              <Text style={styles.achievementDescription}>{a.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  dashedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  achievementIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: '#FFEDE3',
  },
  achievementIconLocked: {
    backgroundColor: colors.background,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  achievementTitleLocked: {
    color: colors.textMuted,
  },
  achievementDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
