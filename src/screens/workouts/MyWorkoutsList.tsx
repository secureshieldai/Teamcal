import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import type { Workout } from '../../types/api';

const AVATAR_COLORS = ['#FDECE4', '#EDE9FE', '#DCFCE7', '#DBEAFE', '#FEF3C7', '#FCE7F3'];

function colorForTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(title: string) {
  return title.trim().slice(0, 2).toUpperCase();
}

type Props = {
  workouts: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
  onOpen: (workout: Workout) => void;
  onCreate: () => void;
};

export default function MyWorkoutsList({ workouts, onEdit, onDelete, onOpen, onCreate }: Props) {
  const confirmDelete = (workout: Workout) => {
    Alert.alert('Delete workout?', `"${workout.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(workout) },
    ]);
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Workouts</Text>
        <TouchableOpacity onPress={onCreate} style={styles.newRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.newText}>New</Text>
        </TouchableOpacity>
      </View>

      {workouts.length === 0 ? (
        <Text style={styles.empty}>No workouts yet. Create your first one below.</Text>
      ) : (
        <View style={{ gap: spacing.md }}>
          {workouts.map((w) => (
            <TouchableOpacity key={w.id} style={[styles.card, shadow.soft]} onPress={() => onOpen(w)} activeOpacity={0.85}>
              <View style={[styles.avatar, { backgroundColor: colorForTitle(w.title) }]}>
                <Text style={styles.avatarText}>{initials(w.title)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{w.title}</Text>
                <Text style={styles.meta}>
                  {w.scheduled_days?.length ? w.scheduled_days.join(', ') : 'Unscheduled'} · {w.exercises.length} ex · ~{w.duration}m
                </Text>
                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>
              </View>
              <TouchableOpacity onPress={() => onEdit(w)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(w)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.createBtn} onPress={onCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color={colors.white} />
        <Text style={styles.createBtnText}>Create workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  newText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    width: '0%',
    backgroundColor: colors.success,
  },
  iconBtn: {
    padding: 4,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  createBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
