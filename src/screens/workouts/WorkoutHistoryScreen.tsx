import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { workoutsService, type WeeklyHistoryEntry } from '../../services/api/workouts.service';

function encouragement(percent: number) {
  if (percent <= 0) return 'Reset week — start with your easiest routine to rebuild momentum.';
  if (percent < 50) return "You're building momentum — one more session this week.";
  if (percent < 100) return 'Almost there — finish strong this week.';
  return 'Perfect week — fantastic consistency!';
}

function percentColor(percent: number) {
  if (percent <= 0) return '#FF4D5E';
  if (percent < 50) return colors.primary;
  return colors.success;
}

type Props = {
  onClose: () => void;
};

export default function WorkoutHistoryScreen({ onClose }: Props) {
  const { data: weeks, loading } = useApiQuery(() => workoutsService.getWeeklyHistory(4), [] as WeeklyHistoryEntry[], []);
  const ordered = [...weeks].reverse();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Workout History</Text>
          <Text style={styles.headerSubtitle}>Weekly summaries</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : (
          ordered.map((week) => (
            <View key={week.weekStart} style={[styles.card, shadow.soft]}>
              <View style={styles.cardHeader}>
                <Text style={styles.weekLabel}>Week of {new Date(`${week.weekStart}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                <Text style={[styles.percent, { color: percentColor(week.percent) }]}>{week.percent}%</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Planned</Text>
                  <Text style={styles.statValue}>{week.planned}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Done</Text>
                  <Text style={styles.statValue}>{week.done}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Time</Text>
                  <Text style={styles.statValue}>{week.minutes}m</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Kcal</Text>
                  <Text style={styles.statValue}>{week.kcal}</Text>
                </View>
              </View>
              <Text style={styles.encouragement}>{encouragement(week.percent)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weekLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  percent: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  encouragement: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
