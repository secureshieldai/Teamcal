import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { fastingService } from '../../services/api/fasting.service';
import type { FastLog } from '../../types/api';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function FastingHistoryTab() {
  const { data: history, loading, error } = useApiQuery(() => fastingService.getHistory(200), [] as FastLog[], []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const daysWithFast = useMemo(() => {
    const set = new Set<string>();
    for (const fast of history) {
      if (fast.ended_at) set.add(dayKey(fast.ended_at));
    }
    return set;
  }, [history]);

  const grid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [monthCursor]);

  const monthLabel = monthCursor.toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.weekdayLabel}>{label}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const key = `${monthCursor.getFullYear()}-${monthCursor.getMonth()}-${day}`;
            const fasted = daysWithFast.has(key);
            return (
              <View key={i} style={styles.cell}>
                <View style={[styles.dayPill, fasted && styles.dayPillFasted]}>
                  <Text style={[styles.dayText, fasted && styles.dayTextFasted]}>{day}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>ALL FASTS</Text>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : error ? (
          <Text style={styles.empty}>Unable to load: {error}</Text>
        ) : history.length === 0 ? (
          <Text style={styles.empty}>No fasts logged yet.</Text>
        ) : (
          history.map((fast) => (
            <View key={fast.id} style={styles.fastRow}>
              <View style={styles.fastInfo}>
                <Text style={styles.fastProtocol}>{fast.protocol}</Text>
                <Text style={styles.fastDate}>{new Date(fast.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <Text style={styles.fastDuration}>{fast.achieved_hours.toFixed(1)}h</Text>
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
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillFasted: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dayTextFasted: {
    color: colors.white,
    fontWeight: '800',
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
    paddingVertical: spacing.md,
  },
  fastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fastInfo: {
    flex: 1,
  },
  fastProtocol: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fastDate: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  fastDuration: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
