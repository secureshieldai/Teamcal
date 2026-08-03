import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService, type TrackerLastNDay } from '../../services/api/tracker.service';
import { useAuth } from '../../context/AuthContext';
import MiniLineChart from '../../components/charts/MiniLineChart';

export default function WaterTrendsTab() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(320, width - spacing.lg * 2 - spacing.lg * 2);
  const { user } = useAuth();
  const goal = user?.goal_water_ml ?? 2500;

  const week = useApiQuery(() => trackerService.getLastN('water', 7), [] as TrackerLastNDay[], []);
  const month = useApiQuery(() => trackerService.getLastN('water', 30), [] as TrackerLastNDay[], []);

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
  const goalDays = month.data.filter((d) => d.total >= goal).length;
  const consistency = month.data.length ? Math.round((goalDays / month.data.length) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>7-DAY TREND</Text>
        {week.loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : week.error ? (
          <Text style={styles.empty}>Unable to load: {week.error}</Text>
        ) : !hasWeekData ? (
          <Text style={styles.empty}>Log some water this week to see trends.</Text>
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
          <Text style={styles.statValue}>{average.toLocaleString()} <Text style={styles.statUnit}>ml</Text></Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>BEST DAY</Text>
          <Text style={styles.statValue}>{best.toLocaleString()} <Text style={styles.statUnit}>ml</Text></Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>GOAL DAYS (30D)</Text>
          <Text style={styles.statValue}>{goalDays}/{month.data.length || 30}</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>CONSISTENCY</Text>
          <Text style={styles.statValue}>{consistency}%</Text>
        </View>
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
});
