import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { WindDownActivity } from '../../hooks/useWindDownRoutine';

type Props = { visible: boolean; activities: WindDownActivity[]; onClose: () => void; onSave: (activities: WindDownActivity[]) => Promise<void> };
const newId = () => `wind-down-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function WindDownRoutineEditor({ visible, activities, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<WindDownActivity[]>(activities);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) setDraft(activities.map((item) => ({ ...item }))); }, [visible, activities]);
  const update = (id: string, patch: Partial<WindDownActivity>) => setDraft((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    setDraft((items) => { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  };
  const save = async () => {
    const cleaned = draft.map((item) => ({ ...item, title: item.title.trim(), time: item.time.trim() }));
    if (cleaned.some((item) => !item.title)) return Alert.alert('Add an activity title', 'Each activity needs a title.');
    if (cleaned.some((item) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))) return Alert.alert('Check the times', 'Use 24-hour HH:MM format, such as 21:30.');
    setSaving(true);
    try { await onSave(cleaned); onClose(); }
    catch (error) { Alert.alert('Unable to save routine', (error as Error).message); }
    finally { setSaving(false); }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.sheet}>
        <View style={s.grabber} />
        <View style={s.header}><View style={{ flex: 1 }}><Text style={s.title}>Edit wind-down routine</Text><Text style={s.subtitle}>Add activities and arrange them in your preferred order.</Text></View><TouchableOpacity onPress={onClose} accessibilityLabel="Close routine editor"><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
        <ScrollView style={s.list} contentContainerStyle={s.listContent} keyboardShouldPersistTaps="handled">
          {draft.map((item, index) => <View key={item.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.order}><TouchableOpacity onPress={() => move(index, -1)} disabled={index === 0}><Ionicons name="chevron-up" size={21} color={index === 0 ? colors.border : colors.textSecondary} /></TouchableOpacity><TouchableOpacity onPress={() => move(index, 1)} disabled={index === draft.length - 1}><Ionicons name="chevron-down" size={21} color={index === draft.length - 1 ? colors.border : colors.textSecondary} /></TouchableOpacity></View>
              <Text style={s.cardTitle}>Activity {index + 1}</Text><TouchableOpacity onPress={() => setDraft((items) => items.filter((entry) => entry.id !== item.id))}><Ionicons name="trash-outline" size={20} color="#D94B4B" /></TouchableOpacity>
            </View>
            <Text style={s.label}>TITLE</Text><TextInput value={item.title} onChangeText={(title) => update(item.id, { title })} placeholder="e.g. Read a book" style={s.input} maxLength={80} />
            <View style={s.details}><View><Text style={s.label}>TIME</Text><TextInput value={item.time} onChangeText={(time) => update(item.id, { time })} placeholder="21:30" style={[s.input, s.time]} keyboardType="numbers-and-punctuation" maxLength={5} /></View>
              <View style={s.reminder}><View><Text style={s.reminderTitle}>Reminder</Text><Text style={s.reminderStatus}>{item.reminderEnabled ? 'On' : 'Off'}</Text></View><Switch value={item.reminderEnabled} onValueChange={(reminderEnabled) => update(item.id, { reminderEnabled })} trackColor={{ false: colors.border, true: '#FFC5AB' }} thumbColor={item.reminderEnabled ? colors.primary : colors.textMuted} /></View>
            </View>
          </View>)}
          <TouchableOpacity style={s.add} onPress={() => setDraft((items) => [...items, { id: newId(), title: '', time: '21:00', reminderEnabled: true }])}><Ionicons name="add-circle-outline" size={20} color={colors.primary} /><Text style={s.addText}>Add activity</Text></TouchableOpacity>
        </ScrollView>
        <View style={s.footer}><TouchableOpacity style={s.cancel} onPress={onClose} disabled={saving}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[s.save, saving && s.disabled]} onPress={save} disabled={saving}><Text style={s.saveText}>{saving ? 'Saving…' : 'Save routine'}</Text></TouchableOpacity></View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.42)', justifyContent: 'flex-end' }, sheet: { height: '88%', backgroundColor: colors.background, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingTop: spacing.md }, grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D7D7DC', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, gap: spacing.md }, title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary }, subtitle: { fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 3 }, list: { flex: 1 }, listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }, cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }, cardTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginLeft: spacing.sm }, order: { flexDirection: 'row', gap: 2 }, label: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, color: colors.textMuted, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.background }, details: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.md }, time: { width: 96 }, reminder: { flex: 1, minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md }, reminderTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary }, reminderStatus: { fontSize: 10.5, color: colors.textSecondary },
  add: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.lg, padding: spacing.md }, addText: { color: colors.primary, fontSize: 13.5, fontWeight: '800' }, footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }, cancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill }, cancelText: { fontWeight: '700', color: colors.textPrimary }, save: { flex: 1.5, alignItems: 'center', paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radii.pill }, saveText: { fontWeight: '800', color: colors.white }, disabled: { opacity: 0.55 },
});
