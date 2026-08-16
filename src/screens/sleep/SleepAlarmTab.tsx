import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { sleepService, type SleepAnalytics } from '../../services/api/sleep.service';

const SOUNDS = ['Sunrise', 'Forest', 'Ocean', 'Birds', 'Chimes'];
const WAKE_WINDOW_MIN = 5;
const WAKE_WINDOW_MAX = 60;

function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

function formatTime(h: number, m: number) {
  return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
}

export default function SleepAlarmTab() {
  const { data: analytics } = useApiQuery(() => sleepService.getAnalytics(1), null as SleepAnalytics | null, []);
  const goalHours = analytics?.goalHours ?? 8;

  const [wakeTime, setWakeTime] = useState('06:30');
  const [smartAlarm, setSmartAlarm] = useState(true);
  const [wakeWindow, setWakeWindow] = useState(30);
  const [sound, setSound] = useState('Sunrise');
  const [editingTime, setEditingTime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    sleepService
      .getAlarmPrefs()
      .then((prefs) => {
        setWakeTime(prefs.wakeTime);
        setSmartAlarm(prefs.smartAlarm);
        setWakeWindow(prefs.wakeWindowMin);
        setSound(prefs.sound);
      })
      .finally(() => setLoaded(true));
  }, []);

  const { h, m } = parseTime(wakeTime);
  const bedtimeHours = Math.floor(goalHours);
  const bedtime = formatTime(h - bedtimeHours, m);

  const adjustHour = (delta: number) => setWakeTime(formatTime(h + delta, m));
  const adjustMinute = (delta: number) => setWakeTime(formatTime(h, m + delta * 5));

  const save = async () => {
    setSaving(true);
    try {
      await sleepService.updateAlarmPrefs({ wakeTime, smartAlarm, wakeWindowMin: wakeWindow, sound });
      Alert.alert('Alarm set', `You'll wake up around ${wakeTime}.`);
    } catch (e) {
      Alert.alert('Unable to save alarm', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.card, { alignItems: 'center' }]}>
        <Ionicons name="sunny" size={20} color={colors.primary} />
        <View style={styles.wakeRow}>
          <Text style={styles.wakeTime}>{wakeTime}</Text>
          <TouchableOpacity style={styles.clockBtn} onPress={() => setEditingTime((v) => !v)}>
            <Ionicons name="time-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.wakeCaption}>
          Bedtime target · {bedtime} · {goalHours}h sleep
        </Text>

        {editingTime && (
          <View style={styles.stepperRow}>
            <View style={styles.stepperCol}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustHour(1)}>
                <Ionicons name="chevron-up" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperLabel}>Hour</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustHour(-1)}>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepperCol}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMinute(1)}>
                <Ionicons name="chevron-up" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperLabel}>+5 min</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMinute(-1)}>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.card, shadow.soft, styles.row]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Smart alarm</Text>
          <Text style={styles.rowSubtitle}>Wake during light sleep</Text>
        </View>
        <TouchableOpacity style={[styles.toggle, smartAlarm && styles.toggleOn]} onPress={() => setSmartAlarm((v) => !v)}>
          <View style={[styles.toggleKnob, smartAlarm && styles.toggleKnobOn]} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.rowTitle}>Wake window · {wakeWindow} min</Text>
        <View
          style={styles.sliderTrack}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / 260));
            setWakeWindow(Math.round(WAKE_WINDOW_MIN + ratio * (WAKE_WINDOW_MAX - WAKE_WINDOW_MIN)));
          }}
          onResponderMove={(e) => {
            const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / 260));
            setWakeWindow(Math.round(WAKE_WINDOW_MIN + ratio * (WAKE_WINDOW_MAX - WAKE_WINDOW_MIN)));
          }}
        >
          <View
            style={[
              styles.sliderFill,
              { width: `${((wakeWindow - WAKE_WINDOW_MIN) / (WAKE_WINDOW_MAX - WAKE_WINDOW_MIN)) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              { left: `${((wakeWindow - WAKE_WINDOW_MIN) / (WAKE_WINDOW_MAX - WAKE_WINDOW_MIN)) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.rowTitle}>Sound</Text>
        <View style={styles.soundRow}>
          {SOUNDS.map((s) => (
            <TouchableOpacity key={s} style={[styles.soundChip, sound === s && styles.soundChipActive]} onPress={() => setSound(s)}>
              <Text style={[styles.soundChipText, sound === s && styles.soundChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Set alarm'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  wakeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  wakeTime: { fontSize: 40, fontWeight: '800', color: colors.textPrimary },
  clockBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wakeCaption: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.sm },
  stepperRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  stepperCol: { alignItems: 'center', gap: 4 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  sliderTrack: { height: 6, borderRadius: 3, backgroundColor: colors.textPrimary, marginTop: spacing.lg, justifyContent: 'center' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3, backgroundColor: colors.primary },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    marginLeft: -9,
  },
  soundRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  soundChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  soundChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  soundChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  soundChipTextActive: { color: colors.white },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
