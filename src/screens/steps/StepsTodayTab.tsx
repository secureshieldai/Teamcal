import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useStepsToday } from '../../hooks/useStepsToday';
import { GOAL_PRESETS } from '../../data/stepsData';

const RING_SIZE = 200;
const RING_STROKE = 16;

function StepsRing({ value, goal, percent }: { value: number; goal: number; percent: number }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={colors.ringTrack} strokeWidth={RING_STROKE} fill="none" />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{value.toLocaleString()}</Text>
        <Text style={styles.ringGoal}>of {goal.toLocaleString()}</Text>
        <Text style={styles.ringPercent}>{percent}%</Text>
      </View>
    </View>
  );
}

export default function StepsTodayTab() {
  const {
    sum, goal, percent, km, kcal, activeMin, streak,
    syncEnabled, syncSupported, syncBusy, toggleSync,
    goalSaving, updateGoal,
  } = useStepsToday();
  const [customGoal, setCustomGoal] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.ringCard, shadow.card]}>
        <StepsRing value={sum} goal={goal} percent={percent} />
        <View style={styles.streakRow}>
          <Ionicons name="trophy" size={16} color={colors.primary} />
          <Text style={styles.streakText}>{streak}-day streak</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statValue}>{km.toFixed(2)}</Text>
          <Text style={styles.statLabel}>KM</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statValue}>{kcal}</Text>
          <Text style={styles.statLabel}>KCAL</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statValue}>{activeMin}</Text>
          <Text style={styles.statLabel}>MIN</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>CONNECTED SOURCES</Text>
        <TouchableOpacity
          style={styles.sourceRow}
          activeOpacity={syncSupported ? 0.7 : 1}
          disabled={!syncSupported || syncBusy}
          onPress={toggleSync}
        >
          <View style={styles.sourceIcon}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.sourceLabel}>Phone motion</Text>
          <Text style={[styles.sourceStatus, syncEnabled && styles.sourceStatusActive]}>
            {!syncSupported ? 'Unavailable' : syncBusy ? 'Please wait…' : syncEnabled ? 'Active' : 'Connect'}
          </Text>
        </TouchableOpacity>
        <View style={styles.sourceRow}>
          <View style={styles.sourceIcon}>
            <Ionicons name="watch-outline" size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.sourceLabel}>Apple Watch</Text>
          <Text style={styles.sourceStatus}>Not connected</Text>
        </View>
        <View style={[styles.sourceRow, { marginBottom: 0 }]}>
          <View style={styles.sourceIcon}>
            <Ionicons name="pulse-outline" size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.sourceLabel}>Fitness tracker</Text>
          <Text style={styles.sourceStatus}>Not connected</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.goalHeader}>
          <Text style={styles.sectionLabel}>DAILY GOAL</Text>
          <Text style={styles.activeGoalText}>Active: {goal.toLocaleString()}</Text>
        </View>
        <View style={styles.presetsRow}>
          {GOAL_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.presetChip, preset === goal && styles.presetChipActive]}
              onPress={() => updateGoal(preset)}
              disabled={goalSaving}
            >
              <Text style={[styles.presetText, preset === goal && styles.presetTextActive]}>{preset.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.customLabel}>CUSTOM GOAL</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customGoal}
            onChangeText={setCustomGoal}
            keyboardType="number-pad"
            placeholder={String(goal)}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.saveButton, !Number(customGoal) && styles.saveButtonDisabled]}
            disabled={!Number(customGoal) || goalSaving}
            onPress={() => {
              updateGoal(Number(customGoal));
              setCustomGoal('');
            }}
          >
            <Text style={styles.saveButtonText}>{goalSaving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
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
  ringCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ringGoal: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ringPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sourceStatusActive: {
    color: colors.success,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeGoalText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  presetTextActive: {
    color: colors.white,
  },
  customLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
