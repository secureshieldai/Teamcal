import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { PreviewStep, sw } from './earn/video/VideoWizardShared';
import type { PreviewType } from './earn/video/videoData';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPreviewSettings'>;
type Scope = 'this' | 'all';

export default function VideoPreviewSettingsScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>('none');
  const [customStart, setCustomStart] = useState('0');
  const [customEnd, setCustomEnd] = useState('30');
  const [previewFileUri, setPreviewFileUri] = useState('');
  const [scope, setScope] = useState<Scope>('this');

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      const md = (a.metadata || {}) as VideoMetadata;
      setPreviewType((md.previewMode as PreviewType) || 'none');
      setCustomStart(String(md.previewStart ?? 0));
      setCustomEnd(String((md.previewStart ?? 0) + (md.previewSeconds ?? 30)));
      setPreviewFileUri(md.trailerUrl || '');
    }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const pickPreviewFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setPreviewFileUri(uploaded.fileUrl);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!video) return;
    setBusy(true);
    try {
      const md = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, {
        metadata: {
          ...md,
          previewMode: previewType,
          previewStart: previewType === 'custom-range' ? Number(customStart) || 0 : previewType === 'first-30' ? 0 : md.previewStart,
          previewSeconds: previewType === 'custom-range' ? Math.max(0, (Number(customEnd) || 0) - (Number(customStart) || 0)) : previewType === 'first-30' ? 30 : md.previewSeconds,
          trailerUrl: previewType === 'custom-upload' ? previewFileUri : md.trailerUrl,
        },
      });
      Alert.alert('Saved', `Preview settings applied to ${scope === 'this' ? 'this video' : 'this video and all future videos'}.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Preview/Paywall</Text>
        <View style={{ width: 22 }} />
      </View>

      <PreviewStep
        previewType={previewType} onPreviewType={setPreviewType}
        customStart={customStart} onCustomStart={setCustomStart}
        customEnd={customEnd} onCustomEnd={setCustomEnd}
        previewFileUri={previewFileUri} onPickPreview={pickPreviewFile}
        allowComments={Boolean((video.metadata as VideoMetadata)?.commentsEnabled ?? true)} onAllowComments={() => undefined}
        allowLikes={true} onAllowLikes={() => undefined}
        addToShowcase={false} onAddToShowcase={() => undefined}
        previewThumbUri={video.image || undefined}
      />

      <View style={s.footer}>
        <Text style={sw.fieldLabel}>Preview will apply to</Text>
        <TouchableOpacity style={s.scopeOption} onPress={() => setScope('this')}>
          <View style={[sw.radioOuter, scope === 'this' && sw.radioOuterActive]}>{scope === 'this' && <View style={sw.radioInner} />}</View>
          <Text style={s.scopeText}>This video only</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.scopeOption} onPress={() => setScope('all')}>
          <View style={[sw.radioOuter, scope === 'all' && sw.radioOuterActive]}>{scope === 'all' && <View style={sw.radioInner} />}</View>
          <Text style={s.scopeText}>All future videos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
          <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Preview'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, fontSize: 16, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  scopeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  scopeText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
