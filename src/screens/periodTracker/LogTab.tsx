import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';
import { personalService } from '../../services/api/personal.service';
import {
  FLOW_OPTIONS, SYMPTOM_OPTIONS, MOOD_OPTIONS, MUCUS_OPTIONS,
} from '../../data/periodTrackerData';

// ─── helpers ──────────────────────────────────────────────────────────────────

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: undefined, month: 'long', day: 'numeric' });
}

const DAY_MS = 86_400_000;

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        {icon}
        <Text style={s.cardTitle}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function ToggleChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, selected && s.chipSelected]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={s.chipRow}>{children}</View>;
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function LogTab({ presetDate }: { presetDate?: number } = {}) {
  const { logs, refetch } = usePeriodTracker();
  const insets = useSafeAreaInsets();

  // Selected date (default = today, or a date handed in from the Predict tab)
  const [selectedDay, setSelectedDay] = useState(startOfDay(presetDate ?? Date.now()));
  const isToday = selectedDay === startOfDay(Date.now());

  // Jump to the date the user tapped in the Predict calendar's "Log symptoms" action
  useEffect(() => {
    if (presetDate !== undefined) setSelectedDay(startOfDay(presetDate));
  }, [presetDate]);

  // Local state for this day's log
  const [periodStatus, setPeriodStatus] = useState<'none' | 'period'>('none');
  const [flow, setFlow] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [energy, setEnergy] = useState('');
  const [bbt, setBbt] = useState('');
  const [mucus, setMucus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Prepopulate from existing logs when day changes
  useMemo(() => {
    const key = dateKey(selectedDay);
    const dayLogs = logs.filter(l => dateKey(l.ts) === key);

    const hasPeriod = dayLogs.some(l => l.type === 'flow' || l.type === 'period-start');
    setPeriodStatus(hasPeriod ? 'period' : 'none');

    const flowLog = dayLogs.find(l => l.type === 'flow');
    setFlow(flowLog ? String(flowLog.value) : '');

    setSymptoms(dayLogs.filter(l => l.type === 'symptom').map(l => String(l.value)));
    setMoods(dayLogs.filter(l => l.type === 'mood').map(l => String(l.value)));

    const energyLog = dayLogs.find(l => l.type === 'intimacy' && ['Low', 'Medium', 'High'].includes(String(l.value)));
    setEnergy(energyLog ? String(energyLog.value) : '');

    const bbtLog = dayLogs.find(l => l.type === 'bbt');
    setBbt(bbtLog ? String(bbtLog.value) : '');

    const mucusLog = dayLogs.find(l => l.type === 'cervical-mucus');
    setMucus(mucusLog ? String(mucusLog.value) : '');

    const noteLog = dayLogs.find(l => l.type === 'note');
    setNote(noteLog ? String(noteLog.value) : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const toggleSymptom = (v: string) =>
    setSymptoms(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleMood = (v: string) =>
    setMoods(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const save = async () => {
    setSaving(true);
    try {
      const ts = selectedDay + 12 * 3600 * 1000; // noon of selected day

      const entries: { type: string; value: string | number }[] = [];

      if (periodStatus === 'period') {
        entries.push({ type: 'period-start', value: 'start' });
        if (flow) entries.push({ type: 'flow', value: flow });
      }
      symptoms.forEach(v => entries.push({ type: 'symptom', value: v }));
      moods.forEach(v => entries.push({ type: 'mood', value: v }));
      if (energy) entries.push({ type: 'intimacy', value: energy });
      if (bbt.trim()) {
        const n = Number(bbt);
        if (Number.isFinite(n) && n > 0) entries.push({ type: 'bbt', value: n });
      }
      if (mucus) entries.push({ type: 'cervical-mucus', value: mucus });
      if (note.trim()) entries.push({ type: 'note', value: note.trim() });

      await Promise.all(entries.map(e =>
        personalService.create('period-log', { type: e.type, value: e.value, ts })
      ));

      await refetch();
      Alert.alert('Saved', isToday ? "Today's log saved." : `Log for ${formatDate(selectedDay)} saved.`);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Flow options — match reference exactly
  const flowOptions = ['Spotting', 'Light', 'Medium', 'Heavy'];
  const moodOptions = ['Calm', 'Happy', 'Sensitive', 'Irritable', 'Anxious'];
  const energyOptions = ['Low', 'Medium', 'High'];
  const symptomOptions = ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Back pain', 'Fatigue'];
  const mucusOptions = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg-white'];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Date navigator ── */}
        <View style={s.dateNav}>
          <TouchableOpacity onPress={() => setSelectedDay(d => d - DAY_MS)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.dateCenter}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={s.dateLabel}>
              {isToday ? 'Today, ' : ''}{formatDate(selectedDay)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedDay(d => Math.min(d + DAY_MS, startOfDay(Date.now())))}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isToday}
          >
            <Ionicons name="chevron-forward" size={22} color={isToday ? colors.border : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Period ── */}
        <SectionCard
          icon={<Ionicons name="water-outline" size={17} color={colors.primary} />}
          label="Period"
        >
          {/* Period toggle */}
          <View style={s.periodToggle}>
            <TouchableOpacity
              style={[s.periodToggleBtn, periodStatus === 'none' && s.periodToggleBtnActive]}
              onPress={() => setPeriodStatus('none')}
            >
              <Text style={[s.periodToggleBtnText, periodStatus === 'none' && s.periodToggleBtnTextActive]}>No period</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.periodToggleBtn, periodStatus === 'period' && s.periodToggleBtnActive]}
              onPress={() => setPeriodStatus('period')}
            >
              <Text style={[s.periodToggleBtnText, periodStatus === 'period' && s.periodToggleBtnTextActive]}>Period day</Text>
            </TouchableOpacity>
          </View>

          {periodStatus === 'period' && (
            <>
              <Text style={s.subLabel}>Flow</Text>
              <ChipRow>
                {flowOptions.map(opt => (
                  <ToggleChip key={opt} label={opt} selected={flow === opt} onPress={() => setFlow(f => f === opt ? '' : opt)} />
                ))}
              </ChipRow>
              <TouchableOpacity style={s.endPeriodBtn} onPress={() => { setPeriodStatus('none'); setFlow(''); }}>
                <Text style={s.endPeriodBtnText}>End period</Text>
              </TouchableOpacity>
            </>
          )}
        </SectionCard>

        {/* ── Symptoms ── */}
        <SectionCard
          icon={<Ionicons name="heart-outline" size={17} color={colors.primary} />}
          label="Symptoms"
        >
          <ChipRow>
            {symptomOptions.map(opt => (
              <ToggleChip key={opt} label={opt} selected={symptoms.includes(opt)} onPress={() => toggleSymptom(opt)} />
            ))}
          </ChipRow>
        </SectionCard>

        {/* ── Mood & energy ── */}
        <SectionCard
          icon={<Ionicons name="happy-outline" size={17} color={colors.primary} />}
          label="Mood & energy"
        >
          <ChipRow>
            {moodOptions.map(opt => (
              <ToggleChip key={opt} label={opt} selected={moods.includes(opt)} onPress={() => toggleMood(opt)} />
            ))}
          </ChipRow>
          <Text style={s.subLabel}>Energy</Text>
          <View style={s.energyRow}>
            {energyOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.energyBtn, energy === opt && s.energyBtnActive]}
                onPress={() => setEnergy(e => e === opt ? '' : opt)}
              >
                <Text style={[s.energyBtnText, energy === opt && s.energyBtnTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── Body signs ── */}
        <SectionCard
          icon={<Ionicons name="pulse-outline" size={17} color={colors.primary} />}
          label="Body signs"
        >
          <View style={s.bbtRow}>
            <View style={s.bbtIconWrap}>
              <Ionicons name="thermometer-outline" size={15} color={colors.primary} />
              <Text style={s.bbtLabel}>Basal body temp</Text>
            </View>
            <TextInput
              style={s.bbtInput}
              value={bbt}
              onChangeText={setBbt}
              placeholder="36.6 °C"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={s.subLabel}>Cervical mucus</Text>
          <ChipRow>
            {mucusOptions.map(opt => (
              <ToggleChip key={opt} label={opt} selected={mucus === opt} onPress={() => setMucus(m => m === opt ? '' : opt)} />
            ))}
          </ChipRow>
        </SectionCard>

        {/* ── Notes ── */}
        <SectionCard
          icon={<Ionicons name="pencil-outline" size={17} color={colors.primary} />}
          label="Notes"
        >
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add anything else you noticed"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </SectionCard>

        {/* spacer for sticky button */}
        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      {/* ── Save button (sticky bottom) ── */}
      <View style={[s.saveWrap, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{isToday ? "Save today's log" : `Save log for ${formatDate(selectedDay)}`}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const ACCENT = colors.primary;  // #FF6A2B
const ACCENT_SOFT = '#FFF0E8';

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },

  // Date nav
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  dateCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  // Cards
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md, ...shadow.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  subLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.xs },

  // Period toggle
  periodToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radii.pill, padding: 3 },
  periodToggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.pill },
  periodToggleBtnActive: { backgroundColor: ACCENT_SOFT },
  periodToggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  periodToggleBtnTextActive: { color: ACCENT, fontWeight: '800' },

  // End period
  endPeriodBtn: { borderWidth: 1.5, borderColor: ACCENT, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  endPeriodBtnText: { fontSize: 13, fontWeight: '700', color: ACCENT },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipSelected: { borderColor: ACCENT, backgroundColor: ACCENT_SOFT },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: ACCENT, fontWeight: '700' },

  // Energy row (3-way equal button)
  energyRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radii.pill, padding: 3 },
  energyBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.pill },
  energyBtnActive: { backgroundColor: ACCENT_SOFT },
  energyBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  energyBtnTextActive: { color: ACCENT, fontWeight: '800' },

  // BBT
  bbtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bbtIconWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bbtLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  bbtInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 13, color: colors.textPrimary, minWidth: 90, textAlign: 'right',
    backgroundColor: colors.background,
  },

  // Notes
  noteInput: {
    backgroundColor: colors.background, borderRadius: radii.lg,
    padding: spacing.md, minHeight: 80, fontSize: 13, color: colors.textPrimary,
  },

  // Save
  saveWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  saveBtn: { backgroundColor: ACCENT, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
