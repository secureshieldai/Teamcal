import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type PdfEdition, type PdfMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { Field, ps } from './earn/pdf/PdfWizardShared';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfNewEdition'>;

export default function PdfNewEditionScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<{ uri: string; name: string; size: number; mimeType?: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [editionName, setEditionName] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [grantExisting, setGrantExisting] = useState(true);
  const [notifyBuyers, setNotifyBuyers] = useState(true);

  useEffect(() => {
    earnService.getAsset(pdfId).then(setPdf).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const sizeMb = (asset.size ?? 0) / 1048576;
    if (sizeMb > 100) return Alert.alert('File too large', 'Maximum file size is 100MB.');
    setFile({ uri: asset.uri, name: asset.name, size: asset.size ?? 0, mimeType: asset.mimeType });
    setUploadedUrl('');
    setBusy(true);
    try {
      const uploaded = await earnService.uploadPdf({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setUploadedUrl(uploaded.fileUrl);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (status: 'draft' | 'published') => {
    if (!file || !uploadedUrl) return Alert.alert('New file required', 'Please upload the updated PDF file.');
    if (!editionName.trim()) return Alert.alert('Edition name required');
    if (!pdf) return;
    setBusy(true);
    try {
      const md = (pdf.metadata || {}) as PdfMetadata;
      const edition: PdfEdition = {
        id: `ed-${Date.now()}`, name: editionName.trim(), fileUrl: uploadedUrl, fileName: file.name, fileSize: file.size,
        releaseNotes: releaseNotes.trim(), notifyBuyers, grantToExistingBuyers: grantExisting,
        createdAt: new Date().toISOString(), status,
      };
      const editions = [...(md.editions || []), edition];
      const patch: Partial<PdfMetadata> = { editions };
      if (status === 'published') {
        patch.fileUrl = uploadedUrl;
        patch.fileName = file.name;
        patch.fileSize = file.size;
        patch.edition = editionName.trim();
      }
      await earnService.updateAsset(pdfId, { metadata: { ...md, ...patch } });
      Alert.alert(
        status === 'published' ? 'New edition published' : 'Edition saved as draft',
        status === 'published'
          ? grantExisting ? 'Existing buyers now have access to this edition.' : 'This edition replaces the current file for new buyers. Existing buyers keep their previously purchased edition.'
          : 'You can publish this edition later from the PDF settings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Unable to save edition', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !pdf) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Upload New Edition</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
        <Text style={s.note}>
          Publishing a new edition keeps the previous edition's sales records intact. Choose below whether existing buyers should receive this update automatically.
        </Text>

        <Text style={ps.fieldLabel}>New PDF file</Text>
        <TouchableOpacity style={s.uploadBox} onPress={pickPdf} disabled={busy}>
          {file ? (
            <>
              <Ionicons name={uploadedUrl ? 'checkmark-circle' : 'time-outline'} size={32} color={uploadedUrl ? colors.success : colors.primary} />
              <Text style={s.uploadedName}>{file.name}</Text>
              <Text style={s.uploadedSize}>{(file.size / 1048576).toFixed(1)} MB {busy && !uploadedUrl ? '· Uploading…' : ''}</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
              <Text style={s.uploadTitle}>Choose updated PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <Field label="Edition name or number" value={editionName} onChangeText={setEditionName} placeholder="e.g. 2nd Edition, v2.0" required />
        <Field label="Release notes" value={releaseNotes} onChangeText={setReleaseNotes} multiline maxLength={600} placeholder="Explain what changed in this edition…" />

        <View style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleLabel}>Give existing buyers this edition</Text>
            <Text style={s.toggleSub}>{grantExisting ? 'Existing buyers will automatically receive the new edition.' : 'Existing buyers keep their originally purchased edition.'}</Text>
          </View>
          <Switch value={grantExisting} onValueChange={setGrantExisting} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>
        <View style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleLabel}>Notify existing buyers</Text>
            <Text style={s.toggleSub}>Send a notification about this update.</Text>
          </View>
          <Switch value={notifyBuyers} onValueChange={setNotifyBuyers} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>

        {file && uploadedUrl && (
          <TouchableOpacity style={s.previewBtn} onPress={() => Alert.alert('Preview edition', `${file.name} is ready to preview.`)}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={s.previewBtnText}>Preview new edition</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[s.publishBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => save('published')}>
          <Text style={s.publishBtnText}>{busy ? 'Saving…' : 'Publish New Edition'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.draftBtn} disabled={busy} onPress={() => save('draft')}>
          <Text style={s.draftBtnText}>Save as Draft</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  note: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.lg, backgroundColor: '#FFF8F5', borderRadius: radii.lg, padding: spacing.md },
  uploadBox: { alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.xs, backgroundColor: colors.card, marginBottom: spacing.md },
  uploadTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadedName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadedSize: { fontSize: 11, color: colors.textSecondary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  toggleSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  previewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  publishBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
