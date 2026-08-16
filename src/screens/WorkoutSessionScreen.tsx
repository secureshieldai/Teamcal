import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { workoutsService } from '../services/api/workouts.service';
import { exercisePerformanceService, type PreviousMap } from '../services/api/exercisePerformance.service';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSession'>;

const MUSCLE_COLORS_PRIMARY = 3;

export default function WorkoutSessionScreen({ route, navigation }: Props) {
  const { workout } = route.params;
  const exercises = workout.exercises;
  const [startedAt] = useState(Date.now());
  const [previous, setPrevious] = useState<PreviousMap>({});
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    exercisePerformanceService.getPrevious(exercises.map((e) => e.name)).then(setPrevious).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSets = useMemo(() => exercises.reduce((n, e) => n + (e.sets || 1), 0), [exercises]);
  const doneSets = useMemo(() => Object.values(completedSets).reduce((n, s) => n + s.size, 0), [completedSets]);
  const percent = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const targetFor = (exerciseName: string, setIndex: number) => {
    const prev = previous[exerciseName]?.[setIndex];
    if (!prev) return null;
    return { weight: Math.round((prev.weight + 2.5) * 10) / 10, reps: prev.reps };
  };

  const toggleSet = async (exerciseName: string, setIndex: number) => {
    const key = exerciseName;
    const already = completedSets[key]?.has(setIndex);
    setCompletedSets((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] ?? []);
      if (already) set.delete(setIndex);
      else set.add(setIndex);
      next[key] = set;
      return next;
    });
    if (!already) {
      const target = targetFor(exerciseName, setIndex);
      const prevSet = previous[exerciseName]?.[setIndex];
      const weight = target?.weight ?? prevSet?.weight ?? 0;
      const reps = target?.reps ?? prevSet?.reps ?? exercises.find((e) => e.name === exerciseName)?.reps ?? 0;
      exercisePerformanceService.logSet(exerciseName, setIndex, weight, reps).catch(() => {});
    }
  };

  const persist = async () => {
    await workoutsService.log({
      workoutId: workout.id,
      title: workout.title,
      duration: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      exercises,
      startedAt,
      endedAt: Date.now(),
    });
  };

  const saveAndExit = async () => {
    setSaving(true);
    try {
      await persist();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to save workout', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await persist();
      Alert.alert('Workout complete', `${doneSets}/${totalSets} sets completed.`, [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save workout', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Leave workout?', 'Save your progress before leaving?', [
              { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
              { text: 'Save & Exit', onPress: saveAndExit },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>{workout.title}</Text>
          <Text style={styles.count}>
            {doneSets}/{totalSets} sets · {percent}%
          </Text>
        </View>
      </View>
      <View style={styles.progress}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sets = item.sets || 1;
          const doneSetIndexes = completedSets[item.name] ?? new Set<number>();
          const firstTarget = targetFor(item.name, 1);
          const firstPrevious = previous[item.name]?.[1];

          return (
            <View style={[styles.card, shadow.soft]}>
              <View style={styles.cardHeader}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="barbell-outline" size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.detail}>
                    {sets}×{item.reps || 'AMRAP'} · rest {item.restSeconds || 60}s
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              {item.muscles && item.muscles.length > 0 && (
                <View style={styles.muscleRow}>
                  {item.muscles.map((m, i) => (
                    <View key={m} style={[styles.muscleTag, i < MUSCLE_COLORS_PRIMARY && styles.muscleTagPrimary]}>
                      <Text style={[styles.muscleTagText, i < MUSCLE_COLORS_PRIMARY && styles.muscleTagTextPrimary]}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.prevTargetRow}>
                <View style={styles.prevBox}>
                  <Text style={styles.boxLabel}>Previous</Text>
                  <Text style={styles.boxValue}>{firstPrevious ? `${firstPrevious.weight} kg × ${firstPrevious.reps}` : '—'}</Text>
                </View>
                <View style={styles.targetBox}>
                  <Text style={[styles.boxLabel, { color: colors.primary }]}>Target</Text>
                  <Text style={[styles.boxValue, { color: colors.primary }]}>
                    {firstTarget ? `${firstTarget.weight} kg × ${firstTarget.reps}` : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.setsRow}>
                {Array.from({ length: sets }, (_, i) => i + 1).map((setIndex) => {
                  const done = doneSetIndexes.has(setIndex);
                  return (
                    <TouchableOpacity
                      key={setIndex}
                      style={[styles.setCircle, done && styles.setCircleDone]}
                      onPress={() => toggleSet(item.name, setIndex)}
                    >
                      {done ? <Ionicons name="checkmark" size={16} color={colors.white} /> : <Text style={styles.setCircleText}>{setIndex}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exitBtn} onPress={saveAndExit} disabled={saving}>
          <Text style={styles.exitBtnText}>Save & exit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={finish} disabled={saving}>
          <Text style={styles.finishBtnText}>{doneSets < totalSets ? 'Finish early' : 'Finish Workout'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary },
  count: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  progress: { height: 4, backgroundColor: colors.border, marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.primary },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 52, height: 52, borderRadius: radii.lg, backgroundColor: colors.border },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  detail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  muscleTag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.background,
  },
  muscleTagPrimary: {
    backgroundColor: '#FFEDE3',
  },
  muscleTagText: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  muscleTagTextPrimary: { color: colors.primary },
  prevTargetRow: { flexDirection: 'row', gap: spacing.sm },
  prevBox: { flex: 1, backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md },
  targetBox: { flex: 1, backgroundColor: '#FFF3EC', borderRadius: radii.lg, padding: spacing.md },
  boxLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  boxValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  setsRow: { flexDirection: 'row', gap: spacing.sm },
  setCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCircleDone: { backgroundColor: colors.success },
  setCircleText: { fontWeight: '700', color: colors.textPrimary },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  exitBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  exitBtnText: { fontWeight: '700', color: colors.textPrimary },
  finishBtn: { flex: 1.4, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  finishBtnText: { color: colors.white, fontWeight: '800' },
});
