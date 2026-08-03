import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useWaterToday } from '../../hooks/useWaterToday';
import { getDrinkType, type DrinkTypeId } from '../../data/waterData';
import DrinkTypeGrid from '../../components/water/DrinkTypeGrid';
import LogDrinkModal from '../../components/water/LogDrinkModal';

const RING_SIZE = 200;
const RING_STROKE = 16;

function HydrationRing({ value, goal, percent }: { value: number; goal: number; percent: number }) {
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
        <Text style={styles.ringGoal}>of {goal.toLocaleString()} ml</Text>
        <Text style={styles.ringPercent}>{percent}% hydrated</Text>
      </View>
    </View>
  );
}

export default function WaterTodayTab() {
  const {
    entries, sum, percent, effectiveGoal, streak,
    weatherOn, workoutOn, toggleWeather, toggleWorkout,
    log, remove,
  } = useWaterToday();
  const [activeType, setActiveType] = useState<DrinkTypeId | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.ringCard, shadow.card]}>
        <HydrationRing value={sum} goal={effectiveGoal} percent={percent} />
        <View style={styles.streakRow}>
          <Ionicons name="water" size={16} color={colors.primary} />
          <Text style={styles.streakText}>{streak}-day streak</Text>
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>LOG A DRINK</Text>
        <DrinkTypeGrid onPressType={setActiveType} />
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>SMART ADJUSTMENTS</Text>
        <TouchableOpacity style={styles.adjustRow} onPress={toggleWeather} activeOpacity={0.8}>
          <Ionicons name="cloud-outline" size={20} color={colors.textSecondary} />
          <View style={styles.adjustInfo}>
            <Text style={styles.adjustTitle}>Normal weather</Text>
            <Text style={styles.adjustSubtitle}>{weatherOn ? 'Enabled · +500 ml' : 'Tap to enable +500 ml'}</Text>
          </View>
          <View style={[styles.toggle, weatherOn && styles.toggleOn]}>
            <View style={[styles.toggleKnob, weatherOn && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adjustRow} onPress={toggleWorkout} activeOpacity={0.8}>
          <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
          <View style={styles.adjustInfo}>
            <Text style={styles.adjustTitle}>Workout day</Text>
            <Text style={styles.adjustSubtitle}>{workoutOn ? 'Enabled · +350 ml' : 'Tap when training'}</Text>
          </View>
          <View style={[styles.toggle, workoutOn && styles.toggleOn]}>
            <View style={[styles.toggleKnob, workoutOn && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>TODAY'S DRINKS</Text>
        {entries.length === 0 ? (
          <Text style={styles.empty}>No drinks logged yet today.</Text>
        ) : (
          entries.map((entry) => {
            const meta = entry.meta as { type?: string; rawMl?: number };
            const type = getDrinkType(meta.type ?? 'water');
            const raw = meta.rawMl ?? entry.value;
            return (
              <View key={entry.id} style={styles.drinkRow}>
                <View style={[styles.drinkIcon, { backgroundColor: type.background }]}>
                  <Ionicons name={type.icon} size={16} color={type.color} />
                </View>
                <View style={styles.drinkInfo}>
                  <Text style={styles.drinkTitle}>{raw} ml {type.label}</Text>
                  <Text style={styles.drinkMeta}>
                    <Text style={styles.drinkTime}>{new Date(entry.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · </Text>
                    <Text style={styles.drinkHydration}>+{entry.value}ml hydration</Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={() => remove(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <LogDrinkModal
        typeId={activeType}
        onClose={() => setActiveType(null)}
        onSubmit={(typeId, rawMl) => {
          log(typeId, rawMl);
          setActiveType(null);
        }}
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
    marginBottom: spacing.lg,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  adjustInfo: {
    flex: 1,
  },
  adjustTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adjustSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleKnobOn: {
    transform: [{ translateX: 18 }],
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  drinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkInfo: {
    flex: 1,
  },
  drinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  drinkMeta: {
    marginTop: 2,
  },
  drinkTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  drinkHydration: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});
