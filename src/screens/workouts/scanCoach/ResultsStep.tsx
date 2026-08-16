import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';
import type { ScanCoachPlan, ScanCoachRoutine } from '../../../services/api/workouts.service';

type Props = {
  plan: ScanCoachPlan;
  saving: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onSave: (selected: ScanCoachRoutine[]) => void;
};

export default function ResultsStep({ plan, saving, onEdit, onRegenerate, onSave }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(plan.routines.map((_, i) => i)));

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FFE7CF', '#FFC58C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.predictionCard}>
        <Text style={styles.predictionLabel}>BODY PREDICTION</Text>
        <Text style={styles.predictionTitle}>
          Realistic timeline: {plan.timelineWeeksMin}–{plan.timelineWeeksMax} weeks
        </Text>
        <Text style={styles.predictionBody}>
          With consistent training, proper nutrition, and discipline, this plan can gradually help you move toward your desired
          physique. Results depend on consistency over time — not shortcuts.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Weekly</Text>
            <Text style={styles.statValue}>{plan.weeklySessions} sessions</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{plan.dailyCalories}/d</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Rest</Text>
            <Text style={styles.statValue}>{plan.restDaysPerWeek} days</Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionLabel}>CHOOSE ROUTINES TO ADD</Text>
      <View style={{ gap: spacing.md }}>
        {plan.routines.map((routine, i) => {
          const active = selected.has(i);
          return (
            <TouchableOpacity key={routine.name} style={[styles.routineCard, active && styles.routineCardActive]} onPress={() => toggle(i)} activeOpacity={0.85}>
              <View style={styles.routineHeader}>
                <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                  {active ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                </View>
                <Text style={styles.routineName}>{routine.name}</Text>
              </View>
              <Text style={styles.routineMeta}>
                {routine.exercises.length} ex · {routine.scheduledDays.join(', ')} · ~{routine.durationMin}m
              </Text>
              {routine.exercises.slice(0, 3).map((ex) => (
                <Text key={ex.name} style={styles.routineExercise}>
                  • {ex.name} — {ex.sets}×{ex.reps || 'AMRAP'}
                </Text>
              ))}
              {routine.exercises.length > 3 ? <Text style={styles.routineExercise}>+{routine.exercises.length - 3} more</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onRegenerate}>
          <Ionicons name="refresh" size={15} color={colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>Regenerate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || selected.size === 0) && { opacity: 0.5 }]}
          onPress={() => onSave(plan.routines.filter((_, i) => selected.has(i)))}
          disabled={saving || selected.size === 0}
        >
          <Ionicons name="save-outline" size={15} color={colors.white} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  predictionCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  predictionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(20,20,43,0.6)',
    letterSpacing: 0.5,
  },
  predictionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  predictionBody: {
    fontSize: 12.5,
    color: 'rgba(20,20,43,0.7)',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(20,20,43,0.55)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  routineCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  routineCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  routineMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 30,
  },
  routineExercise: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 30,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
