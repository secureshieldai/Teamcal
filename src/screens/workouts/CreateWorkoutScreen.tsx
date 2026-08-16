import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { workoutsService } from '../../services/api/workouts.service';
import type { Exercise, Workout } from '../../types/api';

const CATEGORIES = ['Legs', 'Chest', 'Glutes', 'Cardio', 'Core', 'Mobility', 'Full Body', 'Custom'];
const DAYS: { key: string; label: string }[] = [
  { key: 'Sun', label: 'S' },
  { key: 'Mon', label: 'M' },
  { key: 'Tue', label: 'T' },
  { key: 'Wed', label: 'W' },
  { key: 'Thu', label: 'T' },
  { key: 'Fri', label: 'F' },
  { key: 'Sat', label: 'S' },
];

type DraftExercise = { id: string; name: string; sets: string; reps: string; restSeconds: string; notes: string };

function toDraft(exercises: Exercise[]): DraftExercise[] {
  return exercises.map((e) => ({
    id: e.id,
    name: e.name,
    sets: e.sets ? String(e.sets) : '3',
    reps: e.reps ? String(e.reps) : '10',
    restSeconds: e.restSeconds ? String(e.restSeconds) : '60',
    notes: e.notes || '',
  }));
}

function DayCircleRow({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (key: string) => onChange(value.includes(key) ? value.filter((d) => d !== key) : [...value, key]);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dayRow}>
        {DAYS.map((d, i) => {
          const active = value.includes(d.key);
          return (
            <TouchableOpacity key={`${d.key}-${i}`} style={[styles.dayCircle, active && styles.dayCircleActive]} onPress={() => toggle(d.key)}>
              <Text style={[styles.dayCircleText, active && styles.dayCircleTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type Props = {
  existing: Workout | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function CreateWorkoutScreen({ existing, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [scheduledDays, setScheduledDays] = useState<string[]>(existing?.scheduled_days ?? []);
  const [restDays, setRestDays] = useState<string[]>(existing?.rest_days ?? []);
  const [duration, setDuration] = useState(existing ? String(existing.duration) : '30');
  const [exercises, setExercises] = useState<DraftExercise[]>(existing ? toDraft(existing.exercises) : []);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises((prev) => [...prev, { id: `ex-${Date.now()}`, name: 'New exercise', sets: '3', reps: '10', restSeconds: '60', notes: '' }]);
  };

  const updateExercise = (id: string, patch: Partial<DraftExercise>) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeExercise = (id: string) => setExercises((prev) => prev.filter((e) => e.id !== id));

  const canSave = title.trim().length > 0 && exercises.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.toLowerCase(),
        duration: Number(duration) || 30,
        scheduledDays,
        restDays,
        exercises: exercises.map((e) => ({
          id: e.id,
          name: e.name.trim() || 'Exercise',
          detail: `${e.sets}×${e.reps} · rest ${e.restSeconds}s`,
          sets: Number(e.sets) || 0,
          reps: Number(e.reps) || 0,
          restSeconds: Number(e.restSeconds) || 0,
          notes: e.notes.trim() || undefined,
        })),
      };
      if (existing) await workoutsService.update(existing.id, payload);
      else await workoutsService.create(payload);
      onSaved();
    } catch (e) {
      Alert.alert('Unable to save workout', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? 'Edit workout' : 'Create workout'}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadow.card]}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Workout title (e.g. Leg Day)"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => {
              const active = category.toLowerCase() === c.toLowerCase();
              return (
                <TouchableOpacity key={c} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <DayCircleRow label="Scheduled days" value={scheduledDays} onChange={setScheduledDays} />
          <DayCircleRow label="Rest days" value={restDays} onChange={setRestDays} />

          <Text style={styles.fieldLabel}>Estimated duration (min)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        </View>

        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
          <TouchableOpacity onPress={addExercise} style={styles.addRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: spacing.md }}>
          {exercises.map((e) => (
            <View key={e.id} style={[styles.card, shadow.soft]}>
              <View style={styles.exerciseNameRow}>
                <TextInput style={[styles.input, { flex: 1 }]} value={e.name} onChangeText={(v) => updateExercise(e.id, { name: v })} />
                <TouchableOpacity onPress={() => removeExercise(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.setsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Sets</Text>
                  <TextInput style={styles.input} value={e.sets} onChangeText={(v) => updateExercise(e.id, { sets: v })} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Reps</Text>
                  <TextInput style={styles.input} value={e.reps} onChangeText={(v) => updateExercise(e.id, { reps: v })} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Rest (s)</Text>
                  <TextInput style={styles.input} value={e.restSeconds} onChangeText={(v) => updateExercise(e.id, { restSeconds: v })} keyboardType="number-pad" />
                </View>
              </View>
              <TextInput
                style={[styles.input, { marginTop: spacing.sm }]}
                value={e.notes}
                onChangeText={(v) => updateExercise(e.id, { notes: v })}
                placeholder="Notes"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={save} disabled={!canSave}>
          <Ionicons name="save-outline" size={17} color={colors.white} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save workout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
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
  titleInput: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.primary,
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayCircleTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  setsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
