import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoTranscript'>;
type Line = { time: string; text: string };

function parseTranscript(raw: string): Line[] {
  if (!raw.trim()) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const m = line.match(/^\[?(\d{1,2}:\d{2})\]?\s*(.*)$/);
    return m ? { time: m[1], text: m[2] } : { time: '', text: line };
  });
}
function serializeTranscript(lines: Line[]): string {
  return lines.map(l => (l.time ? `[${l.time}] ${l.text}` : l.text)).join('\n');
}

export default function VideoTranscriptScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [raw, setRaw] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      const md = (a.metadata || {}) as VideoMetadata;
      setRaw(md.transcript || '');
    }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const lines = useMemo(() => parseTranscript(raw), [raw]);
  const filtered = useMemo(
    () => search.trim() ? lines.filter(l => l.text.toLowerCase().includes(search.toLowerCase())) : lines,
    [lines, search]
  );

  const updateLine = (index: number, text: string) => {
    const targetLine = filtered[index];
    const realIndex = lines.indexOf(targetLine);
    const next = [...lines];
    next[realIndex] = { ...next[realIndex], text };
    setRaw(serializeTranscript(next));
  };

  const save = async () => {
    if (!video) return;
    setSaving(true);
    try {
      const md = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, { metadata: { ...md, transcript: raw } });
      Alert.alert('Saved', 'Transcript updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Transcript</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search transcript…" placeholderTextColor={colors.textMuted} />
      </View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {filtered.length ? filtered.map((line, i) => (
          <View key={`${line.time}-${i}`} style={s.lineRow}>
            {!!line.time && <Text style={s.time}>{line.time}</Text>}
            <TextInput
              style={s.lineInput}
              value={line.text}
              onChangeText={t => updateLine(i, t)}
              multiline
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )) : (
          <TextInput
            style={s.blankInput}
            value={raw}
            onChangeText={setRaw}
            multiline
            placeholder="No transcript yet. Start typing, or paste one with timestamps like [00:05] Line text…"
            placeholderTextColor={colors.textMuted}
          />
        )}
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Transcript'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  lineRow: { flexDirection: 'row', gap: spacing.sm },
  time: { fontSize: 11, fontWeight: '700', color: colors.primary, width: 44, marginTop: 10 },
  lineInput: { flex: 1, fontSize: 13, color: colors.textPrimary, backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.sm, lineHeight: 19 },
  blankInput: { fontSize: 13, color: colors.textPrimary, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, minHeight: 260, textAlignVertical: 'top', lineHeight: 20 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
