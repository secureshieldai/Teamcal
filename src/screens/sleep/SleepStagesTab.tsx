import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { sleepService, type SleepLog } from '../../services/api/sleep.service';

const STAGE_META = [
  { key: 'awake' as const, label: 'Awake', color: '#F5B93D' },
  { key: 'rem' as const, label: 'REM', color: '#B08CFF' },
  { key: 'light' as const, label: 'Light', color: '#6FC7F7' },
  { key: 'deep' as const, label: 'Deep', color: '#6C6BE0' },
];

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SleepStagesTab() {
  const { data: history } = useApiQuery(() => sleepService.getHistory(1), [] as SleepLog[], []);
  const lastNight = history[0];
  const stages = lastNight?.stages;
  const durationMin = (lastNight?.duration_hours ?? 0) * 60;

  const totalPercent = stages ? stages.awake + stages.rem + stages.light + stages.deep : 100;
  const percents = STAGE_META.map((s) => ({
    ...s,
    percent: stages ? Math.round((stages[s.key] / (totalPercent || 1)) * 100) : 0,
    minutes: stages ? (stages[s.key] / 100) * durationMin : 0,
  }));

  const efficiency = stages ? 100 - stages.awake : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {!stages ? (
        <Text style={styles.empty}>Complete a night of sleep tracking to see your stage breakdown.</Text>
      ) : (
        <>
          <View style={[styles.barCard, shadow.soft]}>
            <View style={styles.bar}>
              {percents.map((s, i) => (
                <View
                  key={s.key}
                  style={[
                    styles.barSegment,
                    { backgroundColor: s.color, width: `${s.percent}%` },
                    i === 0 && styles.barSegmentFirst,
                    i === percents.length - 1 && styles.barSegmentLast,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.legendGrid}>
            {percents.map((s) => (
              <View key={s.key} style={styles.legendItem}>
                <View style={styles.legendHeader}>
                  <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                  <Text style={styles.legendLabel}>{s.label}</Text>
                  <Text style={styles.legendPercent}>{s.percent}%</Text>
                </View>
                <View style={styles.legendTrack}>
                  <View style={[styles.legendFill, { width: `${s.percent}%` }]} />
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.card, shadow.soft]}>
            <Text style={styles.cardTitle}>Recovery breakdown</Text>
            <View style={styles.recoveryRow}>
              <View style={styles.recoveryCol}>
                <Text style={styles.recoveryLabel}>Deep</Text>
                <Text style={styles.recoveryValue}>{formatMinutes(percents.find((p) => p.key === 'deep')?.minutes ?? 0)}</Text>
              </View>
              <View style={styles.recoveryCol}>
                <Text style={styles.recoveryLabel}>REM</Text>
                <Text style={styles.recoveryValue}>{formatMinutes(percents.find((p) => p.key === 'rem')?.minutes ?? 0)}</Text>
              </View>
              <View style={styles.recoveryCol}>
                <Text style={styles.recoveryLabel}>Efficiency</Text>
                <Text style={[styles.recoveryValue, { color: colors.success }]}>{efficiency}%</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  barCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  bar: { flexDirection: 'row', height: 90, borderRadius: radii.lg, overflow: 'hidden' },
  barSegment: { height: '100%' },
  barSegmentFirst: { borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg },
  barSegmentLast: { borderTopRightRadius: radii.lg, borderBottomRightRadius: radii.lg },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { width: '47%' },
  legendHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  legendPercent: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  legendTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  legendFill: { height: 4, backgroundColor: colors.primary },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  recoveryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recoveryCol: { alignItems: 'center' },
  recoveryLabel: { fontSize: 12, color: colors.textSecondary },
  recoveryValue: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
});
