import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../../theme';
import { useFastingNow } from '../../hooks/useFastingNow';
import ProtocolPickerModal from '../../components/fasting/ProtocolPickerModal';
import FastingInsightsSection from '../../components/fasting/FastingInsightsSection';
import type { RootStackParamList } from '../../navigation/types';

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const RING_SIZE = 260;
const RING_STROKE = 3;
const QUICK_ADJUST = [-1, 1, 2];

function FastingRing({ percent, children }: { percent: number; children: React.ReactNode }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference * (1 - clamped / 100);
  const dotAngle = (clamped / 100) * 2 * Math.PI;
  const center = RING_SIZE / 2;
  const dotX = center + radius * Math.cos(dotAngle);
  const dotY = center + radius * Math.sin(dotAngle);

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radius} stroke="#F3E4D8" strokeWidth={RING_STROKE} fill="none" />
        {clamped > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            fill="none"
          />
        )}
        <Circle cx={dotX} cy={dotY} r={6} fill={colors.primary} />
      </Svg>
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function FastingNowTab({ navigation }: Props) {
  const {
    active, elapsedSeconds, elapsedHours, remainingSeconds, stage, caloriesSaved, streak, history,
    busy, displayPaused, toggleDisplayPause, start, stop, extend,
  } = useFastingNow();
  const [pickerOpen, setPickerOpen] = useState(false);

  const weekDays = useMemo(() => {
    const successDays = new Set<string>();
    for (const fast of history) {
      if (fast.ended_at && fast.achieved_hours >= fast.target_hours) {
        const d = new Date(fast.ended_at);
        successDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start0 = new Date(today);
    start0.setDate(start0.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start0);
      d.setDate(start0.getDate() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return { label: WEEK_LABELS[i], done: successDays.has(key), isToday: d.getTime() === today.getTime() };
    });
  }, [history]);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {active ? (
        <View style={[styles.timerCard, shadow.card]}>
          <FastingRing percent={(elapsedHours / active.target_hours) * 100}>
            <Text style={styles.statusLabel}>{displayPaused ? 'PAUSED' : 'FASTING'}</Text>
            <Text style={styles.timerValue}>{formatElapsed(elapsedSeconds)}</Text>
            <Text style={styles.statusSub}>{stage.label}</Text>
            <Text style={styles.goalCountdown}>{formatElapsed(remainingSeconds)} to goal</Text>
          </FastingRing>

          <View style={styles.activeActionsRow}>
            <TouchableOpacity style={styles.pauseButton} onPress={toggleDisplayPause} activeOpacity={0.85}>
              <Ionicons name={displayPaused ? 'play' : 'pause'} size={15} color={colors.textPrimary} />
              <Text style={styles.pauseButtonText}>{displayPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endButton} onPress={stop} disabled={busy} activeOpacity={0.85}>
              <Ionicons name="stop" size={15} color={colors.white} />
              <Text style={styles.endButtonText}>{busy ? 'Please wait…' : 'End fast'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adjustRow}>
            {QUICK_ADJUST.map((hours) => (
              <TouchableOpacity key={hours} style={styles.adjustChip} onPress={() => extend(hours)} activeOpacity={0.8}>
                <Text style={styles.adjustChipText}>{hours > 0 ? `+${hours}h` : `${hours}h`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.timerCard, shadow.card]}>
          <Text style={styles.statusLabel}>NOT FASTING</Text>
          <Text style={styles.timerValue}>{formatElapsed(elapsedSeconds)}</Text>
          <Text style={styles.statusSub}>Fed</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => setPickerOpen(true)} disabled={busy} activeOpacity={0.85}>
            <Ionicons name="play" size={16} color={colors.white} />
            <Text style={styles.startButtonText}>Start fasting</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statTile, shadow.card]}>
          <View style={[styles.statIcon, { backgroundColor: '#FFEDE3' }]}>
            <Ionicons name="flame" size={18} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{caloriesSaved || '—'}</Text>
          <Text style={styles.statLabel}>CALORIES SAVED</Text>
        </View>
        <View style={[styles.statTile, shadow.card]}>
          <View style={[styles.statIcon, { backgroundColor: '#FDE3E3' }]}>
            <Ionicons name="trophy" size={18} color="#E0554F" />
          </View>
          <Text style={styles.statValue}>{streak}d</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
        <TouchableOpacity style={[styles.statTile, shadow.card]} onPress={() => navigation.navigate('Water')} activeOpacity={0.8}>
          <View style={[styles.statIcon, { backgroundColor: '#E3F0FD' }]}>
            <Ionicons name="water" size={18} color="#3E7BFA" />
          </View>
          <Text style={styles.statValueSmall}>Reminder</Text>
          <Text style={styles.statLabel}>WATER</Text>
        </TouchableOpacity>
      </View>

      <FastingInsightsSection stage={stage} active={!!active} />

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.weekRow}>
          {weekDays.map((d, i) => (
            <View key={i} style={styles.weekItem}>
              <View style={[styles.weekDot, d.done && styles.weekDotDone, d.isToday && styles.weekDotToday]} />
              <Text style={styles.weekLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ProtocolPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(protocolId, customTargetHours) => {
          setPickerOpen(false);
          start(protocolId, customTargetHours);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.lg,
  },
  timerCard: {
    backgroundColor: '#FFF8F2',
    borderRadius: radii.xl,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  statusLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statusSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
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
  goalCountdown: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  pauseButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  endButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  adjustChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
  },
  adjustChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statValueSmall: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    minHeight: 112,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  weekItem: {
    alignItems: 'center',
    gap: 6,
    minHeight: 46,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDotToday: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  weekLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
