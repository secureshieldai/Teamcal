import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useWeightTracker, type WeightRange } from '../../hooks/useWeightTracker';
import SegmentedControl from '../../components/SegmentedControl';
import WeightTrendChart from '../../components/charts/WeightTrendChart';

const RANGES: WeightRange[] = ['7D', '30D', '3M', '6M', '1Y', 'All'];

export default function WeightHistoryTab() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(340, width - spacing.lg * 2 - spacing.lg * 2);
  const { entries, latest, lowest, highest, totalChange, forRange, loading, error, remove } = useWeightTracker();
  const [range, setRange] = useState<WeightRange>('30D');

  const rangePoints = useMemo(() => forRange(range), [forRange, range]);
  const rangeSummary = useMemo(() => {
    const first = rangePoints[0];
    const last = rangePoints[rangePoints.length - 1];
    const change = first && last ? last.value - first.value : 0;
    const average = rangePoints.length ? rangePoints.reduce((sum, entry) => sum + entry.value, 0) / rangePoints.length : 0;
    return { change, average, count: rangePoints.length };
  }, [rangePoints]);

  const confirmRemove = (id: string) => Alert.alert(
    'Delete this check-in?',
    'This entry will be permanently removed from your progress.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void remove(id) }]
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.sectionTitle}>Progress Overview</Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewChip}>
                <Text style={[styles.overviewValue, { color: colors.primary }]}>{latest ? latest.value.toFixed(1) : '—'}</Text>
                <Text style={styles.overviewUnit}>kg</Text>
                <Text style={styles.overviewLabel}>Latest</Text>
              </View>
              <View style={styles.overviewChip}>
                <Text style={[styles.overviewValue, { color: colors.navy }]}>{lowest ? lowest.toFixed(1) : '—'}</Text>
                <Text style={styles.overviewUnit}>kg</Text>
                <Text style={styles.overviewLabel}>Lowest</Text>
              </View>
              <View style={styles.overviewChip}>
                <Text style={[styles.overviewValue, { color: colors.navy }]}>{highest ? highest.toFixed(1) : '—'}</Text>
                <Text style={styles.overviewUnit}>kg</Text>
                <Text style={styles.overviewLabel}>Highest</Text>
              </View>
              <View style={styles.overviewChip}>
                <Text style={[styles.overviewValue, { color: colors.success }]}>
                  {totalChange === 0 ? '0.0' : `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}`}
                </Text>
                <Text style={styles.overviewUnit}>kg</Text>
                <Text style={styles.overviewLabel}>Total Change</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, shadow.card, { marginTop: spacing.lg }]}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>{range === '7D' ? 'This week' : range === '30D' ? 'Last 30 days' : range === 'All' ? 'All-time progress' : `Last ${range}`}</Text>
              <View style={[styles.trendBadge, { backgroundColor: rangeSummary.change <= 0 ? '#E4F8ED' : '#FDE3E3' }]}>
                <Ionicons name={rangeSummary.change > 0 ? 'trending-up' : 'trending-down'} size={13} color={rangeSummary.change <= 0 ? colors.success : '#E0554F'} />
                <Text style={[styles.trendBadgeText, { color: rangeSummary.change <= 0 ? colors.success : '#E0554F' }]}>{rangeSummary.change > 0 ? '+' : ''}{rangeSummary.change.toFixed(1)} kg</Text>
              </View>
            </View>
            <SegmentedControl options={RANGES} value={range} onChange={(v) => setRange(v as WeightRange)} variant="pill" />
            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              {loading ? (
                <Text style={styles.empty}>Loading…</Text>
              ) : error ? (
                <Text style={styles.empty}>Unable to load: {error}</Text>
              ) : (
                <WeightTrendChart
                  points={rangePoints.map((e) => ({ ts: e.ts, value: e.value }))}
                  unit="kg"
                  width={chartWidth}
                  height={160}
                />
              )}
            </View>
            <View style={styles.chartSummary}>
              <View><Text style={styles.summaryValue}>{rangeSummary.average ? rangeSummary.average.toFixed(1) : '—'} kg</Text><Text style={styles.summaryLabel}>Average</Text></View>
              <View style={styles.summaryDivider} />
              <View><Text style={styles.summaryValue}>{rangeSummary.count}</Text><Text style={styles.summaryLabel}>Check-ins</Text></View>
              <View style={styles.summaryDivider} />
              <View><Text style={styles.summaryValue}>{rangeSummary.count > 1 ? Math.abs(rangeSummary.change).toFixed(1) : '—'} kg</Text><Text style={styles.summaryLabel}>Movement</Text></View>
            </View>
          </View>

          <Text style={styles.entriesTitle}>Weight Entries</Text>
        </>
      }
      ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading history…' : 'No weight entries yet.'}</Text>}
      renderItem={({ item, index }) => {
        const previous = entries[index + 1];
        const delta = previous ? item.value - previous.value : 0;
        return (
          <TouchableOpacity style={[styles.entryCard, shadow.soft]} onPress={() => confirmRemove(item.id)} accessibilityHint="Tap to delete this entry">
            <View style={{ flex: 1 }}>
              <Text style={styles.entryDate}>{new Date(item.ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              <Text style={styles.entryTime}>{new Date(item.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
              {typeof item.meta?.note === 'string' && item.meta.note ? <Text style={styles.entryNote} numberOfLines={1}>{item.meta.note}</Text> : null}
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>{item.value.toFixed(1)} kg</Text>
              {previous ? (
                <View style={styles.entryDeltaRow}>
                  <Ionicons name={delta > 0 ? 'arrow-up' : delta < 0 ? 'arrow-down' : 'remove'} size={11} color={delta > 0 ? '#E0554F' : delta < 0 ? colors.success : colors.textMuted} />
                  <Text style={[styles.entryDeltaText, { color: delta > 0 ? '#E0554F' : delta < 0 ? colors.success : colors.textMuted }]}>
                    {Math.abs(delta).toFixed(1)} kg
                  </Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.sm },
  trendBadgeText: { fontSize: 11, fontWeight: '800' },
  chartSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.background, borderRadius: radii.lg, paddingVertical: spacing.md, marginTop: spacing.sm },
  summaryValue: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  summaryLabel: { fontSize: 9.5, color: colors.textSecondary, marginTop: 3, textAlign: 'center' },
  summaryDivider: { width: 1, height: 26, backgroundColor: colors.border },
  overviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewChip: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  overviewUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  overviewLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryTime: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  entryNote: { maxWidth: 150, fontSize: 10.5, color: colors.textSecondary, marginTop: 4 },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  entryDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  entryDeltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
});
