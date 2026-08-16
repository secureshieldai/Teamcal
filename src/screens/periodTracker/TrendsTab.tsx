import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';

function heatColor(count: number) {
  if (count === 0) return colors.border;
  if (count === 1) return '#FFC7D6';
  if (count === 2) return '#FF93AF';
  return '#F26D8D';
}

export default function TrendsTab() {
  const { avgCycle, avgPeriod, cyclesTracked, regularity, ninetyDayHeatmap, symptomCounts, avgBbt, pmsDays, lateBy } = usePeriodTracker();

  const topSymptoms = symptomCounts.slice(0, 3);
  const maxCount = topSymptoms.length ? topSymptoms[0].count : 1;

  const regularityColor = regularity === 'Good' ? colors.success : regularity === 'Fair' ? '#F5B93D' : colors.macroProtein;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Avg cycle</Text>
          <Text style={styles.statValue}>{avgCycle}d</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Avg period</Text>
          <Text style={styles.statValue}>{avgPeriod}d</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Cycles tracked</Text>
          <Text style={styles.statValue}>{cyclesTracked}</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Regularity</Text>
          <Text style={[styles.statValue, { color: regularityColor }]}>{regularity}</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.heatmapHeader}>
          <Text style={styles.cardTitle}>Symptom heatmap</Text>
          <Text style={styles.heatmapCaption}>LAST 90 DAYS</Text>
        </View>
        <View style={styles.heatGrid}>
          {ninetyDayHeatmap.map((day) => (
            <View key={day.key} style={[styles.heatCell, { backgroundColor: heatColor(day.count) }]} />
          ))}
        </View>
        <View style={styles.heatLegend}>
          <Text style={styles.heatLegendLabel}>Less</Text>
          <View style={[styles.heatCell, { backgroundColor: colors.border }]} />
          <View style={[styles.heatCell, { backgroundColor: '#FFC7D6' }]} />
          <View style={[styles.heatCell, { backgroundColor: '#F26D8D' }]} />
          <Text style={styles.heatLegendLabel}>More</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.cardTitle}>Most common symptoms</Text>
        {topSymptoms.length === 0 ? (
          <Text style={styles.empty}>Log symptoms to see patterns here.</Text>
        ) : (
          topSymptoms.map((s) => (
            <View key={s.label} style={styles.symptomRow}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomLabel}>{s.label}</Text>
                <Text style={styles.symptomCount}>{s.count} logs</Text>
              </View>
              <View style={styles.symptomTrack}>
                <View style={[styles.symptomFill, { width: `${(s.count / maxCount) * 100}%` }]} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.bodyRow}>
        <View style={[styles.bodyPill, shadow.soft]}>
          <Text style={styles.bodyValue}>{avgBbt !== null ? `${avgBbt.toFixed(1)}°` : '—'}</Text>
          <Text style={styles.bodyLabel}>Avg BBT</Text>
        </View>
        <View style={[styles.bodyPill, shadow.soft]}>
          <Text style={styles.bodyValue}>{pmsDays}</Text>
          <Text style={styles.bodyLabel}>PMS days</Text>
        </View>
        <View style={[styles.bodyPill, shadow.soft]}>
          <Text style={styles.bodyValue}>
            {lateBy === 0 ? '±0d' : `${lateBy > 0 ? '+' : ''}${lateBy}d`}
          </Text>
          <Text style={styles.bodyLabel}>Late by</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: { width: '47%', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  heatmapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heatmapCaption: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: 12, height: 12, borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-end' },
  heatLegendLabel: { fontSize: 10.5, color: colors.textMuted, marginHorizontal: 2 },
  empty: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  symptomRow: { marginTop: spacing.md },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  symptomLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  symptomCount: { fontSize: 12, color: colors.textSecondary },
  symptomTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  symptomFill: { height: 6, backgroundColor: colors.primary },
  bodyRow: { flexDirection: 'row', gap: spacing.md },
  bodyPill: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, paddingVertical: spacing.lg },
  bodyValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  bodyLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
});
