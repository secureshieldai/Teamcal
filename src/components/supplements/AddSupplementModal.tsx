import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { TIME_OF_DAY_META, type TimeOfDay } from '../../data/supplementData';
import type { SupplementItem } from '../../hooks/useSupplements';

type Props = {
  visible: boolean;
  initial?: Partial<SupplementItem> | null;
  onClose: () => void;
  onSubmit: (item: Omit<SupplementItem, 'id' | 'createdAt'>) => Promise<void>;
};

export default function AddSupplementModal({ visible, initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [takeWithFood, setTakeWithFood] = useState(false);
  const [refillDays, setRefillDays] = useState('30');
  const [costUsd, setCostUsd] = useState('20');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setDose(initial?.dose ?? '');
    setTimeOfDay(initial?.timeOfDay ?? 'morning');
    setReminderTime(initial?.reminderTime ?? '08:00');
    setTakeWithFood(initial?.takeWithFood ?? false);
    setRefillDays(String(initial?.refillDays ?? 30));
    setCostUsd(String(initial?.costUsd ?? 20));
  }, [visible, initial]);

  const isEditing = !!initial?.name;

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        dose: dose.trim(),
        timeOfDay,
        reminderTime,
        takeWithFood,
        refillDays: Number(refillDays) || 30,
        costUsd: Number(costUsd) || 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Edit supplement' : 'Add supplement'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name (e.g. Ashwagandha)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={dose}
              onChangeText={setDose}
              placeholder="Dose (e.g. 600 mg)"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.sectionLabel}>TIME OF DAY</Text>
            <View style={styles.pillRow}>
              {TIME_OF_DAY_META.map((t) => {
                const active = timeOfDay === t.id;
                return (
                  <TouchableOpacity key={t.id} style={[styles.pill, active && styles.pillActive]} onPress={() => setTimeOfDay(t.id)}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.reminderLabelRow}>
              <Ionicons name="notifications-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>EXACT REMINDER TIME</Text>
            </View>
            <TextInput
              style={styles.input}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="08:00"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.caption}>You'll get a push at exactly this time.</Text>

            <TouchableOpacity style={styles.checkRow} onPress={() => setTakeWithFood((v) => !v)} activeOpacity={0.8}>
              <Ionicons name={takeWithFood ? 'checkbox' : 'square-outline'} size={20} color={takeWithFood ? colors.primary : colors.textMuted} />
              <Text style={styles.checkLabel}>Take with food</Text>
            </TouchableOpacity>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>REFILL (DAYS)</Text>
                <TextInput style={styles.input} value={refillDays} onChangeText={setRefillDays} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>COST ($)</Text>
                <TextInput style={styles.input} value={costUsd} onChangeText={setCostUsd} keyboardType="number-pad" />
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, (!name.trim() || saving) && { opacity: 0.6 }]} onPress={submit} disabled={!name.trim() || saving}>
              <Text style={styles.submitText}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add to stack'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  pillTextActive: { color: colors.white },
  reminderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  caption: { fontSize: 11.5, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowFields: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  submitText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
