import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useSleepNow } from '../../hooks/useSleepNow';
import { useApiQuery } from '../../hooks/useApiQuery';
import { sleepService, type SleepAnalytics, type SleepAlarmPrefs } from '../../services/api/sleep.service';
import WindDownRoutineEditor from '../../components/sleep/WindDownRoutineEditor';
import { useWindDownRoutine } from '../../hooks/useWindDownRoutine';

const RING_SIZE = 190;
const RING_STROKE = 14;

const WIND_DOWN_ROUTINE = [
  { time: '21:30', label: 'Screens off' },
  { time: '21:45', label: 'Warm shower' },
  { time: '22:00', label: '4-7-8 breathing' },
  { time: '22:30', label: 'Lights out' },
];

function formatBedtime(wakeTime: string, goalHours: number) {
  const [h, m] = wakeTime.split(':').map(Number);
  const total = ((h - goalHours) * 60 + m + 24 * 60) % (24 * 60);
  const hh = Math.floor(total / 60);
  const mm = Math.round(total % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatRoutineTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function ScoreRing({ score, active }: { score: number; active: boolean }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = active ? 0 : Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={colors.ringTrack} strokeWidth={RING_STROKE} fill="none" />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke="#F5B93D"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Ionicons name="moon" size={20} color="#F5B93D" />
        <Text style={styles.ringValue}>{active ? 0 : score}</Text>
        <Text style={styles.ringLabel}>Sleep score</Text>
      </View>
    </View>
  );
}

export default function SleepTonightTab() {
  const [editingRoutine, setEditingRoutine] = useState(false);
  const { active, lastNight, busy, elapsedHours, start, stop } = useSleepNow();
  const { activities, save: saveRoutine } = useWindDownRoutine();
  const { data: analytics } = useApiQuery(() => sleepService.getAnalytics(14), null as SleepAnalytics | null, []);
  const { data: alarmPrefs } = useApiQuery(() => sleepService.getAlarmPrefs(), null as SleepAlarmPrefs | null, []);

  const goalHours = analytics?.goalHours ?? 8;
  const wakeTime = alarmPrefs?.wakeTime ?? '06:30';
  const bedtime = formatBedtime(wakeTime, goalHours);
  const debt = analytics?.debt ?? 0;

  const caption = active
    ? `${(lastNight?.duration_hours ?? 0).toFixed(1)}h last night`
    : lastNight
    ? `${(lastNight.duration_hours ?? 0).toFixed(1)}h last night`
    : 'Log your first night';

  const elapsedLabel = `${Math.floor(elapsedHours)}.${String(Math.round((elapsedHours % 1) * 100)).padStart(2, '0')}h`;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={active ? ['#FFE4E1', '#FFFFFF'] : ['#FFF6DD', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.ringCard}
      >
        <ScoreRing score={lastNight?.score ?? 0} active={!!active} />
        <Text style={styles.caption}>{caption}</Text>
      </LinearGradient>

      {active ? (
        <View style={[styles.trackingCard, shadow.card]}>
          <Ionicons name="bed" size={28} color={colors.primary} />
          <Text style={styles.trackingValue}>{elapsedLabel}</Text>
          <Text style={styles.trackingLabel}>Tracking sleep</Text>
          <TouchableOpacity style={styles.wakeBtn} onPress={stop} disabled={busy}>
            <Ionicons name="square-outline" size={15} color={colors.textPrimary} />
            <Text style={styles.wakeBtnText}>Wake up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.startBtn} onPress={start} disabled={busy} activeOpacity={0.85}>
          <Ionicons name="bed" size={18} color={colors.white} />
          <Text style={styles.startBtnText}>{busy ? 'Starting…' : 'Start sleep tracking'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Bedtime</Text>
          <Text style={styles.statValue}>{bedtime}</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Wake</Text>
          <Text style={styles.statValue}>{wakeTime}</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Debt</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{debt.toFixed(1)}h</Text>
        </View>
      </View>

      {false && <View style={[styles.routineCard, shadow.soft]}>
        <Text style={styles.routineTitle}>Wind-down routine</Text>
        {WIND_DOWN_ROUTINE.map((step) => (
          <Text key={step.time} style={styles.routineRow}>
            · {step.time} — {step.label}
          </Text>
        ))}
      </View>}

      <View style={[styles.routineCard, shadow.soft]}>
        <View style={styles.routineHeader}>
          <Text style={styles.routineTitle}>Wind-down routine</Text>
          <TouchableOpacity style={styles.editRoutineButton} onPress={() => setEditingRoutine(true)}>
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={styles.editRoutineText}>Edit Routine</Text>
          </TouchableOpacity>
        </View>
        {activities.length ? activities.map((step) => (
          <View key={step.id} style={styles.personalRoutineRow}>
            <View style={[styles.routineDot, !step.reminderEnabled && styles.routineDotOff]} />
            <Text style={styles.routineTime}>{formatRoutineTime(step.time)}</Text>
            <Text style={styles.routineLabel}>{step.title}</Text>
            <Ionicons name={step.reminderEnabled ? 'notifications-outline' : 'notifications-off-outline'} size={15} color={step.reminderEnabled ? colors.primary : colors.textMuted} />
          </View>
        )) : <Text style={styles.emptyRoutine}>No activities yet. Tap Edit Routine to add one.</Text>}
      </View>

      <WindDownRoutineEditor visible={editingRoutine} activities={activities} onClose={() => setEditingRoutine(false)} onSave={saveRoutine} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  ringCard: { borderRadius: radii.xl, alignItems: 'center', paddingVertical: spacing.xl },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  ringLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  caption: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.lg },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
  },
  startBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  trackingCard: { backgroundColor: colors.card, borderRadius: radii.xl, alignItems: 'center', padding: spacing.xl, gap: 4 },
  trackingValue: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  trackingLabel: { fontSize: 13, color: colors.textSecondary },
  wakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  wakeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, paddingVertical: spacing.lg },
  statLabel: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  routineCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  routineTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  routineRow: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  routineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  editRoutineButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 8, borderRadius: radii.pill, backgroundColor: '#FFF3EC' },
  editRoutineText: { fontSize: 11.5, fontWeight: '800', color: colors.primary },
  personalRoutineRow: { flexDirection: 'row', alignItems: 'center', minHeight: 34, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  routineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  routineDotOff: { backgroundColor: colors.textMuted },
  routineTime: { width: 68, fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  routineLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  emptyRoutine: { fontSize: 12.5, color: colors.textSecondary, paddingVertical: spacing.md },
});
