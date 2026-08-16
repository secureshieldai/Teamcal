import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useWorkoutsHome } from '../../hooks/useWorkouts';
import { workoutsService } from '../../services/api/workouts.service';
import MyWorkoutsList from './MyWorkoutsList';
import type { Workout } from '../../types/api';

type Props = {
  onOpenScanCoach: () => void;
  onOpenRecommendations: () => void;
  onOpenProgress: () => void;
  onOpenHistory: () => void;
  onCreateWorkout: () => void;
  onEditWorkout: (workout: Workout) => void;
  onStartWorkout: (workout: Workout) => void;
};

const TOOLS = [
  { key: 'scan', title: 'Scan & Coach', subtitle: 'AI body transformation', icon: 'sparkles' as const, bg: '#FDECE4', fg: colors.primary },
  { key: 'recs', title: 'Recommendations', subtitle: 'AI insights from your progress', icon: 'flash' as const, bg: '#EDE9FE', fg: '#7C5CFC' },
  { key: 'progress', title: 'Progress', subtitle: 'Photos, PRs & analytics', icon: 'trending-up' as const, bg: '#DCFCE7', fg: colors.success },
  { key: 'history', title: 'History', subtitle: 'Weekly workout summaries', icon: 'calendar' as const, bg: '#DBEAFE', fg: '#3E7BFA' },
];

export default function WorkoutsHome({
  onOpenScanCoach,
  onOpenRecommendations,
  onOpenProgress,
  onOpenHistory,
  onCreateWorkout,
  onEditWorkout,
  onStartWorkout,
}: Props) {
  const { todayWorkout, todayAbbr, workouts, streak, refetch } = useWorkoutsHome();

  const handleDelete = async (workout: Workout) => {
    await workoutsService.remove(workout.id);
    await refetch();
  };

  const handlers: Record<string, () => void> = {
    scan: onOpenScanCoach,
    recs: onOpenRecommendations,
    progress: onOpenProgress,
    history: onOpenHistory,
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FFE7CF', '#FFB877']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {todayWorkout ? (
          <>
            <Text style={styles.heroCaption}>TODAY · {todayAbbr.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{todayWorkout.title}</Text>
            <Text style={styles.heroSubtitle}>
              {todayWorkout.exercises.length} exercises · ~{todayWorkout.duration}m
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.startBtn} onPress={() => onStartWorkout(todayWorkout)} activeOpacity={0.85}>
                <Ionicons name="play" size={14} color={colors.white} />
                <Text style={styles.startText}>Start</Text>
              </TouchableOpacity>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={16} color={colors.primary} />
                <Text style={styles.streakText}>{streak}d</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroCaption}>TODAY · {todayAbbr.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>Rest day</Text>
            <Text style={styles.heroSubtitle}>No workout scheduled for today.</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.startBtn} onPress={onCreateWorkout} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={colors.white} />
                <Text style={styles.startText}>Create</Text>
              </TouchableOpacity>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={16} color={colors.primary} />
                <Text style={styles.streakText}>{streak}d</Text>
              </View>
            </View>
          </>
        )}
      </LinearGradient>

      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <TouchableOpacity key={tool.key} style={[styles.tile, shadow.soft]} onPress={handlers[tool.key]} activeOpacity={0.85}>
            <View style={[styles.tileIcon, { backgroundColor: tool.bg }]}>
              <Ionicons name={tool.icon} size={20} color={tool.fg} />
            </View>
            <Text style={styles.tileTitle}>{tool.title}</Text>
            <Text style={styles.tileSubtitle}>{tool.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <MyWorkoutsList
        workouts={workouts}
        onEdit={onEditWorkout}
        onDelete={handleDelete}
        onOpen={onStartWorkout}
        onCreate={onCreateWorkout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  heroCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(20,20,43,0.55)',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: 'rgba(20,20,43,0.65)',
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  startText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tileSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
