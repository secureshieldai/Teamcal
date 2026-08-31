import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type PdfMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { BuyerPreviewSettings, ps } from './earn/pdf/PdfWizardShared';
import type { BuyerPreviewType } from './earn/pdf/pdfData';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfPreviewSettings'>;

export default function PdfPreviewSettingsScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewType, setPreviewType] = useState<BuyerPreviewType>('first-pages');
  const [previewPages, setPreviewPages] = useState('5');
  const [specificPages, setSpecificPages] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customFile, setCustomFile] = useState<PdfMetadata['customPreviewFile']>(undefined);

  useEffect(() => {
    earnService.getAsset(pdfId).then(a => {
      setPdf(a);
      const md = (a.metadata || {}) as PdfMetadata;
      setPreviewType((md.previewType || 'first-pages') as BuyerPreviewType);
      setPreviewPages(String(md.previewPages || 5));
      setSpecificPages(md.specificPages || '');
      setCustomFile(md.customPreviewFile);
    }).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  const pickCustomFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      const uploaded = await earnService.uploadPdf({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setCustomFile({ fileUrl: uploaded.fileUrl, fileName: asset.name, fileSize: asset.size ?? 0, fileType: asset.mimeType || 'application/pdf' });
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!pdf) return;
    setBusy(true);
    try {
      const md = (pdf.metadata || {}) as PdfMetadata;
      await earnService.updateAsset(pdfId, {
        metadata: {
          ...md,
          previewType,
          previewMode: previewType,
          previewPages: previewType === 'first-pages' ? Number(previewPages) || 5 : undefined,
          specificPages: previewType === 'specific-pages' ? specificPages : undefined,
          customPreviewFile: previewType === 'custom-content' ? customFile : undefined,
        },
      });
      Alert.alert('Saved', 'Buyer preview settings updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
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
        <Text style={s.headerTitle}>Preview Settings</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={ps.chapterContent}>
        <BuyerPreviewSettings
          previewType={previewType} onPreviewType={setPreviewType}
          previewPages={previewPages} onPreviewPages={setPreviewPages}
          specificPages={specificPages} onSpecificPages={setSpecificPages}
          customContent={customContent} onCustomContent={setCustomContent}
        />

        {previewType === 'custom-content' && (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={ps.fieldLabel}>Custom preview file</Text>
            {customFile ? (
              <View style={s.fileCard}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fileName} numberOfLines={1}>{customFile.fileName}</Text>
                  <Text style={s.fileMeta}>{customFile.fileType} · {(customFile.fileSize / 1048576).toFixed(1)} MB{customFile.pages ? ` · ${customFile.pages} pages` : ''}</Text>
                </View>
              </View>
            ) : (
              <Text style={s.emptyFileText}>No custom preview file uploaded yet.</Text>
            )}
            <View style={s.fileActionsRow}>
              {customFile && (
                <TouchableOpacity style={s.fileActionBtn} onPress={() => Alert.alert('Preview file', customFile.fileName)}>
                  <Text style={s.fileActionText}>View</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.fileActionBtn} onPress={pickCustomFile} disabled={busy}>
                <Text style={s.fileActionText}>{customFile ? 'Replace' : 'Upload'}</Text>
              </TouchableOpacity>
              {customFile && (
                <TouchableOpacity style={s.fileActionBtn} onPress={() => setCustomFile(undefined)}>
                  <Text style={[s.fileActionText, { color: '#EF4444' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity style={s.previewBuyerBtn} onPress={() => navigation.navigate('PdfReader', { pdfId, preview: true })}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={s.previewBuyerBtnText}>Preview buyer experience</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
          <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Preview Settings'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.xs },
  fileName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  fileMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  emptyFileText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  fileActionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  fileActionBtn: { paddingVertical: 6 },
  fileActionText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  previewBuyerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginTop: spacing.lg },
  previewBuyerBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
