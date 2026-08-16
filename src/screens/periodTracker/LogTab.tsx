import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';
import { FLOW_OPTIONS, INTIMACY_OPTIONS, MOOD_OPTIONS, MUCUS_OPTIONS, SYMPTOM_OPTIONS } from '../../data/periodTrackerData';
import { Chip, ChipWrap } from './shared';

const TYPE_LABEL: Record<string, string> = {
  'period-start': 'Period-Start',
  flow: 'Flow',
  bbt: 'BBT',
  'cervical-mucus': 'Mucus',
  symptom: 'Symptom',
  mood: 'Mood',
  intimacy: 'Intimacy',
  note: 'Note',
};

function isToday(ts: number) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

export default function LogTab() {
  const { logs, log } = usePeriodTracker();
  const [bbtValue, setBbtValue] = useState('');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loggedToday = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) if (isToday(l.ts)) set.add(`${l.type}:${l.value}`);
    return set;
  }, [logs]);

  const isSelected = (type: string, value: string) => loggedToday.has(`${type}:${value}`);

  const submitBbt = async () => {
    const n = Number(bbtValue);
    if (!Number.isFinite(n) || n <= 0) return;
    await log('bbt', n);
    setBbtValue('');
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await log('note', note.trim());
      setNote('');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.title}>Period flow</Text>
        <ChipWrap>
          {FLOW_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={isSelected('flow', opt)} onPress={() => log('flow', opt)} />
          ))}
        </ChipWrap>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => log('period-start', 'start')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Start of period</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.titleRow}>
          <Ionicons name="thermometer-outline" size={16} color={colors.primary} />
          <Text style={styles.title}>Basal body temp</Text>
        </View>
        <View style={styles.bbtRow}>
          <TextInput
            style={styles.bbtInput}
            value={bbtValue}
            onChangeText={setBbtValue}
            placeholder="36.6 °C"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.logBtn} onPress={submitBbt} activeOpacity={0.85}>
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.caption}>Measure first thing in the morning for the sharpest ovulation signal.</Text>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.titleRow}>
          <Text style={styles.mucusIcon}>〰️</Text>
          <Text style={styles.title}>Cervical mucus</Text>
        </View>
        <ChipWrap>
          {MUCUS_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={isSelected('cervical-mucus', opt)} onPress={() => log('cervical-mucus', opt)} />
          ))}
        </ChipWrap>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.title}>Symptoms</Text>
        <ChipWrap>
          {SYMPTOM_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={isSelected('symptom', opt)} onPress={() => log('symptom', opt)} />
          ))}
        </ChipWrap>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.title}>Mood</Text>
        <ChipWrap>
          {MOOD_OPTIONS.map((opt) => (
            <Chip key={opt.label} label={`${opt.emoji} ${opt.label}`} selected={isSelected('mood', opt.label)} onPress={() => log('mood', opt.label)} />
          ))}
        </ChipWrap>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.title}>Intimacy</Text>
        <ChipWrap>
          {INTIMACY_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={isSelected('intimacy', opt)} onPress={() => log('intimacy', opt)} />
          ))}
        </ChipWrap>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <Text style={styles.title}>Note</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Anything you want to remember?"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <TouchableOpacity style={[styles.primaryBtn, savingNote && { opacity: 0.6 }]} onPress={saveNote} disabled={savingNote} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{savingNote ? 'Saving…' : 'Save note'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: spacing.sm }}>
        {logs.slice(0, 15).map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryLabel}>
              {TYPE_LABEL[entry.type] ?? entry.type}
              {entry.type !== 'period-start' && entry.type !== 'note' ? ` · ${entry.value}` : ''}
            </Text>
            <Text style={styles.entryDate}>{new Date(entry.ts).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mucusIcon: { fontSize: 15 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  bbtRow: { flexDirection: 'row', gap: spacing.md },
  bbtInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  logBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  caption: { fontSize: 11.5, color: colors.textMuted },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  entryLabel: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  entryDate: { fontSize: 12, color: colors.textMuted },
});
