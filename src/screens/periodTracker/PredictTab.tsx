import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CATEGORY_BG: Record<string, string> = {
  period: '#F26D8D',
  fertile: '#FFD9B3',
  ovulation: '#FFC488',
  luteal: '#E3DFFB',
  follicular: '#FFF6DD',
};
const CATEGORY_TEXT: Record<string, string> = {
  period: colors.white,
  fertile: '#B4620B',
  ovulation: '#B4620B',
  luteal: '#5B4FBF',
  follicular: '#B79A3A',
};

export default function PredictTab() {
  const { classifyDate, next3Cycles } = usePeriodTracker();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = new Date().toDateString();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.calendarCard, shadow.card]}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setViewMonth(new Date(year, month - 1, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setViewMonth(new Date(year, month + 1, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={`${w}-${i}`} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((date, i) => {
            if (!date) return <View key={`empty-${i}`} style={styles.cell} />;
            const category = classifyDate(date.getTime());
            const isToday = date.toDateString() === todayKey;
            return (
              <View key={date.toISOString()} style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    { backgroundColor: CATEGORY_BG[category] },
                    isToday && styles.dayCircleToday,
                  ]}
                >
                  <Text style={[styles.dayText, { color: CATEGORY_TEXT[category] }]}>{date.getDate()}</Text>
                </View>
                {category === 'ovulation' && <View style={styles.ovulationDot} />}
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.cardTitle}>Next 3 cycles</Text>
        {next3Cycles.map((ts, i) => (
          <View key={ts} style={styles.cycleRow}>
            <View style={styles.cycleLeft}>
              <View style={styles.cycleDot} />
              <Text style={styles.cycleLabel}>Cycle #{i + 1}</Text>
            </View>
            <Text style={styles.cycleDate}>{new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
        ))}
        <Text style={styles.cycleCaption}>Predictions improve with 3+ logged cycles.</Text>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.legendTitle}>LEGEND</Text>
        <View style={styles.legendGrid}>
          <LegendItem color={CATEGORY_BG.period} label="Period" />
          <LegendItem color={CATEGORY_BG.fertile} label="Fertile window" />
          <LegendItem color={CATEGORY_BG.ovulation} label="Ovulation" />
          <LegendItem color={CATEGORY_BG.luteal} label="Luteal" />
        </View>
      </View>
    </ScrollView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  calendarCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '700', color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCircleToday: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontSize: 12.5, fontWeight: '700' },
  ovulationDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  cycleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  cycleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cycleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F26D8D' },
  cycleLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  cycleDate: { fontSize: 13, color: colors.textSecondary },
  cycleCaption: { fontSize: 11.5, color: colors.textMuted, marginTop: spacing.sm },
  legendTitle: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '45%' },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
});
