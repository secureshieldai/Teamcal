import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { sleepService, type SleepAnalytics } from '../../services/api/sleep.service';
import MiniBarChart from '../../components/charts/MiniBarChart';

export default function SleepTrendsTab() {
  const { data: analytics, loading } = useApiQuery(() => sleepService.getAnalytics(14), null as SleepAnalytics | null, []);
  const daily = analytics?.daily ?? [];
  const values = daily.map((d) => Math.max(0.1, d.hours));
  const hasData = daily.some((d) => d.hours > 0);

  return (
    <View style={styles.content}>
      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.sectionLabel}>HOURS SLEPT · 14D</Text>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : !hasData ? (
          <Text style={styles.empty}>No nights logged in the last 14 days yet.</Text>
        ) : (
          <>
            <MiniBarChart values={values} height={90} />
            <View style={styles.labelRow}>
              {daily.map((d) => (
                <Text key={d.day} style={styles.dayLabel}>
                  {d.day.slice(8)}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>{(analytics?.avg ?? 0).toFixed(1)}h</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={styles.statValue}>{(analytics?.best ?? 0).toFixed(1)}h</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Nights</Text>
          <Text style={styles.statValue}>{analytics?.nights ?? 0}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayLabel: { fontSize: 9, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, paddingVertical: spacing.lg },
  statLabel: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
});
