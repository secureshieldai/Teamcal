import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useJournal } from '../hooks/useJournal';
import { MOOD_SCALE, WRITE_PROMPTS, type MoodLevel } from '../data/journalData';
import type { RootStackParamList } from '../navigation/types';

export default function MoodJournalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { entries, streak, avgMood7d, saveEntry, removeEntry } = useJournal();

  const [activePrompt, setActivePrompt] = useState(WRITE_PROMPTS[0]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodLevel>('good');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const save = async () => {
    if (!text.trim()) {
      Alert.alert('Write something first', 'Add a few words before saving your entry.');
      return;
    }
    setSaving(true);
    try {
      const ok = await saveEntry({ text: text.trim(), mood, promptUsed: activePrompt, type: 'written' });
      if (ok) setText('');
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (search.trim() && !e.text.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (dateFilter.trim()) {
        const entryDate = new Date(e.ts).toLocaleDateString('en-GB').split('/').join('-'); // dd-mm-yyyy
        if (!entryDate.includes(dateFilter.trim())) return false;
      }
      return true;
    });
  }, [entries, search, dateFilter]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete entry?', 'This journal entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Journaling</Text>
          <Text style={styles.subtitle}>Smart tags & prompts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#CFE0FB', '#F3D8F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>JOURNAL STREAK</Text>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={20} color={colors.primary} />
                <Text style={styles.streakValue}>{streak}</Text>
                <Text style={styles.streakUnit}>days</Text>
              </View>
              <Text style={styles.avgMood}>Avg mood 7d: {avgMood7d !== null ? avgMood7d.toFixed(1) : '—'}/5</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="create" size={24} color={colors.white} />
            </View>
          </View>
          <View style={styles.heroDivider} />
        </LinearGradient>

        <View style={[styles.card, shadow.soft]}>
          <View style={styles.promptLabelRow}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
            <Text style={styles.promptLabel}>PROMPT</Text>
          </View>
          <Text style={styles.promptText}>{activePrompt}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptChipsRow}>
            {WRITE_PROMPTS.map((p) => {
              const active = p === activePrompt;
              return (
                <TouchableOpacity key={p} style={[styles.promptChip, active && styles.promptChipActive]} onPress={() => setActivePrompt(p)}>
                  <Text style={[styles.promptChipText, active && styles.promptChipTextActive]} numberOfLines={1}>
                    {p.length > 22 ? `${p.slice(0, 20)}…` : p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={setText}
              placeholder="Write freely — tags auto-attach"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <Text style={styles.sectionLabel}>MOOD</Text>
          <View style={styles.moodRow}>
            {MOOD_SCALE.map((m) => {
              const active = mood === m.id;
              return (
                <TouchableOpacity key={m.id} style={styles.moodOption} onPress={() => setMood(m.id)}>
                  <View style={[styles.moodCircle, active && styles.moodCircleActive]}>
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  </View>
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={17} color={colors.white} />
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save entry'}</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={styles.callBtn} onPress={() => navigation.navigate('LiveJournalCall')} activeOpacity={0.85}>
            <View style={styles.callIcon}>
              <Ionicons name="call" size={18} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.callTitle}>Journal on live call</Text>
              <Text style={styles.callSubtitle}>Talk it out with Blaze — she'll ask questions & summarize.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search by keyword" placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <TextInput style={styles.searchInput} value={dateFilter} onChangeText={setDateFilter} placeholder="dd-mm-yyyy" placeholderTextColor={colors.textMuted} />
        </View>

        <Text style={styles.entriesTitle}>ENTRIES ({filteredEntries.length})</Text>
        {filteredEntries.length === 0 ? (
          <Text style={styles.empty}>No journal entries yet.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {filteredEntries.map((entry) => {
              const moodMeta = MOOD_SCALE.find((m) => m.id === entry.mood);
              return (
                <TouchableOpacity key={entry.id} style={[styles.entryCard, shadow.soft]} onLongPress={() => confirmDelete(entry.id)} activeOpacity={0.85}>
                  <Text style={styles.entryEmoji}>{moodMeta?.emoji ?? '🙂'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryText} numberOfLines={2}>
                      {entry.text}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {entry.type === 'live-call' ? 'Live call · ' : ''}
                      {new Date(entry.ts).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.navy },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { borderRadius: radii.xl, padding: spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(20,20,43,0.5)', letterSpacing: 0.6 },
  streakRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: spacing.sm },
  streakValue: { fontSize: 30, fontWeight: '800', color: colors.textPrimary },
  streakUnit: { fontSize: 15, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  avgMood: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.sm },
  heroIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroDivider: { borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  promptLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  promptLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  promptText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  promptChipsRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  promptChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.card, maxWidth: 170 },
  promptChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  promptChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  promptChipTextActive: { color: colors.white },
  textAreaWrap: { position: 'relative', marginBottom: spacing.lg },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 130,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
    paddingRight: 56,
  },
  micBtn: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  moodOption: { alignItems: 'center', gap: 4 },
  moodCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  moodCircleActive: { backgroundColor: '#E8F9F0', borderWidth: 1.5, borderColor: colors.success },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  moodLabelActive: { color: colors.success, fontWeight: '800' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, borderRadius: radii.xl, padding: spacing.lg },
  callIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  callTitle: { fontSize: 14.5, fontWeight: '800', color: colors.white },
  callSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  entriesTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: spacing.lg },
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  entryEmoji: { fontSize: 22 },
  entryText: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  entryMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
