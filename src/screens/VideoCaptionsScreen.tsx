import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoCaptionTrack, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { LanguageDropdown, sw } from './earn/video/VideoWizardShared';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCaptions'>;

export default function VideoCaptionsScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [language, setLanguage] = useState('English');
  const [tracks, setTracks] = useState<VideoCaptionTrack[]>([]);

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      const md = (a.metadata || {}) as VideoMetadata;
      setTracks(md.captionTracks || []);
      setLanguage(md.language || 'English');
    }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const persist = async (nextTracks: VideoCaptionTrack[]) => {
    if (!video) return;
    const md = (video.metadata || {}) as VideoMetadata;
    const updated = await earnService.updateAsset(videoId, { metadata: { ...md, captionTracks: nextTracks, captionsUrl: nextTracks.find(t => t.active)?.fileUrl } });
    setVideo(updated);
    setTracks(nextTracks);
  };

  const uploadCaptionFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'application/x-subrip', 'text/vtt', '*/*'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'text/plain' });
      const track: VideoCaptionTrack = { id: `cap-${Date.now()}`, language, fileUrl: uploaded.fileUrl, fileName: asset.name, fileSize: asset.size ?? 0, source: 'uploaded', active: true };
      await persist([...tracks.map(t => ({ ...t, active: false })), track]);
      Alert.alert('Captions uploaded', `${asset.name} added.`);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const generateCaptions = async () => {
    setGenerating(true);
    try {
      // Placeholder for real speech-to-text integration.
      await new Promise(res => setTimeout(res, 1200));
      const track: VideoCaptionTrack = { id: `cap-${Date.now()}`, language, fileUrl: `generated://${videoId}/${language}.srt`, fileName: `${language} (Auto-generated).srt`, fileSize: 12400, source: 'generated', active: true };
      await persist([...tracks.map(t => ({ ...t, active: false })), track]);
      Alert.alert('Captions generated', `Auto-generated ${language} captions are ready.`);
    } catch (e) {
      Alert.alert('Generation failed', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const setActive = (id: string) => persist(tracks.map(t => ({ ...t, active: t.id === id })));
  const removeTrack = (id: string) => Alert.alert('Remove captions?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => persist(tracks.filter(t => t.id !== id)) },
  ]);

  const save = async () => {
    if (!video) return;
    setBusy(true);
    try {
      const md = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, { metadata: { ...md, language } });
      Alert.alert('Saved', 'Caption settings updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setBusy(false);
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
        <Text style={s.headerTitle}>Add Captions</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={sw.stepContent}>
        <LanguageDropdown value={language} onChange={setLanguage} />

        <Text style={sw.fieldLabel}>Add Captions</Text>
        <TouchableOpacity style={s.optionCard} onPress={uploadCaptionFile} disabled={busy}>
          <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
          <Text style={s.optionText}>{busy ? 'Uploading…' : 'Upload Caption File'}</Text>
          <Text style={s.optionSub}>SRT, VTT, or TXT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.optionCard, s.optionCardAi]} onPress={generateCaptions} disabled={generating}>
          <Ionicons name="sparkles-outline" size={20} color="#8B5CF6" />
          <Text style={[s.optionText, { color: '#8B5CF6' }]}>{generating ? 'Generating…' : 'Generate Captions'}</Text>
          <Text style={s.optionSub}>Auto-generate using AI</Text>
        </TouchableOpacity>

        <Text style={[sw.fieldLabel, { marginTop: spacing.lg }]}>Existing Captions</Text>
        {tracks.map(track => (
          <View key={track.id} style={s.trackRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.trackLang}>{track.language}{track.source === 'generated' ? ' (Auto-generated)' : ''}</Text>
              <Text style={s.trackMeta}>{track.fileName.split('.').pop()?.toUpperCase()} · {(track.fileSize / 1024).toFixed(0)}KB</Text>
              {track.active && <View style={s.activePill}><Text style={s.activePillText}>● Active</Text></View>}
            </View>
            <TouchableOpacity onPress={() => Alert.alert(track.fileName, undefined, [
              { text: track.active ? 'Already active' : 'Set Active', onPress: () => !track.active && setActive(track.id) },
              { text: 'Remove', style: 'destructive', onPress: () => removeTrack(track.id) },
              { text: 'Cancel', style: 'cancel' },
            ])}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        {!tracks.length && <Text style={s.emptyText}>No captions yet.</Text>}

        <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
          <Text style={s.saveBtnText}>Save Captions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  optionCardAi: { backgroundColor: '#F5F3FF' },
  optionText: { fontSize: 13, fontWeight: '700', color: colors.primary, flex: 1 },
  optionSub: { fontSize: 10.5, color: colors.textMuted },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  trackLang: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  trackMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  activePill: { alignSelf: 'flex-start', marginTop: 4 },
  activePillText: { fontSize: 10, fontWeight: '700', color: colors.success },
  emptyText: { fontSize: 12, color: colors.textMuted },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
