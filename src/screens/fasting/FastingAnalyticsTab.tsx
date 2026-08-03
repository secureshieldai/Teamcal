import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { fastingService } from '../../services/api/fasting.service';
import MiniLineChart from '../../components/charts/MiniLineChart';

interface Analytics {
  longest: number;
  avg: number;
  total: number;
  successRate: number;
  totalHours: number;
  last30: number[];
  protocolCounts: Record<string, number>;
}

const EMPTY_ANALYTICS: Analytics = { longest: 0, avg: 0, total: 0, successRate: 0, totalHours: 0, last30: [], protocolCounts: {} };

export default function FastingAnalyticsTab() {
  const { data, loading, error } = useApiQuery(() => fastingService.getAnalytics(), EMPTY_ANALYTICS, []);
  const hasTrend = data.last30.some((v) => v > 0);
  const protocolEntries = Object.entries(data.protocolCounts);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>LONGEST</Text>
          <Text style={styles.statValue}>{data.longest.toFixed(1)} <Text style={styles.statUnit}>h</Text></Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>AVERAGE</Text>
          <Text style={styles.statValue}>{data.avg.toFixed(1)} <Text style={styles.statUnit}>h</Text></Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>TOTAL FASTS</Text>
          <Text style={styles.statValue}>{data.total}</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>SUCCESS RATE</Text>
          <Text style={styles.statValue}>{data.successRate}<Text style={styles.statUnit}>%</Text></Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>30-DAY TREND</Text>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : error ? (
          <Text style={styles.empty}>Unable to load: {error}</Text>
        ) : !hasTrend ? (
          <Text style={styles.empty}>Log fasts to see your trend.</Text>
        ) : (
          <MiniLineChart values={data.last30} labels={[]} height={90} />
        )}
        <View style={styles.trendFooter}>
          <Text style={styles.trendFooterLabel}>Total hours fasted</Text>
          <Text style={styles.trendFooterValue}>{Math.round(data.totalHours)} h</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>PROTOCOL BREAKDOWN</Text>
        {protocolEntries.length === 0 ? (
          <Text style={styles.empty}>Log fasts to see your patterns.</Text>
        ) : (
          protocolEntries.map(([protocol, count]) => (
            <View key={protocol} style={styles.protocolRow}>
              <Text style={styles.protocolLabel}>{protocol}</Text>
              <Text style={styles.protocolCount}>{count} fast{count === 1 ? '' : 's'}</Text>
            </View>
          ))
        )}
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
    marginBottom: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
  trendFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trendFooterLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  trendFooterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  protocolLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  protocolCount: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
