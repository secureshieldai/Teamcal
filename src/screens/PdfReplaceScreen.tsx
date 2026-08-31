import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type PdfMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfReplace'>;

export default function PdfReplaceScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newFile, setNewFile] = useState<{ uri: string; name: string; size: number; mimeType?: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    earnService.getAsset(pdfId).then(setPdf).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const sizeMb = (asset.size ?? 0) / 1048576;
    if (sizeMb > 100) return Alert.alert('File too large', 'Maximum file size is 100MB.');
    if (!asset.name.toLowerCase().endsWith('.pdf')) return Alert.alert('Invalid file', 'Please select a PDF file.');
    setNewFile({ uri: asset.uri, name: asset.name, size: asset.size ?? 0, mimeType: asset.mimeType });
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

  const confirmReplace = async () => {
    if (!newFile || !uploadedUrl || !pdf) return;
    setBusy(true);
    try {
      const md = (pdf.metadata || {}) as PdfMetadata;
      await earnService.updateAsset(pdfId, {
        metadata: { ...md, fileUrl: uploadedUrl, fileName: newFile.name, fileSize: newFile.size },
      });
      Alert.alert('PDF replaced', 'The current PDF has been replaced successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to replace PDF', (e as Error).message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (loading || !pdf) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  const md = (pdf.metadata || {}) as PdfMetadata;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Replace PDF</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>Current PDF</Text>
        <View style={s.fileCard}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.fileName} numberOfLines={1}>{md.fileName || `${pdf.title}.pdf`}</Text>
            <Text style={s.fileMeta}>{md.fileSize ? `${(md.fileSize / 1048576).toFixed(1)} MB` : 'Existing file'}</Text>
          </View>
        </View>

        <Text style={[s.label, { marginTop: spacing.lg }]}>Replacement PDF</Text>
        <TouchableOpacity style={s.uploadBox} onPress={pickPdf} disabled={busy}>
          {newFile ? (
            <>
              <Ionicons name={uploadedUrl ? 'checkmark-circle' : 'time-outline'} size={36} color={uploadedUrl ? colors.success : colors.primary} />
              <Text style={s.uploadedName}>{newFile.name}</Text>
              <Text style={s.uploadedSize}>{(newFile.size / 1048576).toFixed(1)} MB {busy && !uploadedUrl ? '· Uploading…' : ''}</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
              <Text style={s.uploadTitle}>Choose replacement PDF</Text>
              <Text style={s.uploadSub}>PDF only · Max 100MB</Text>
            </>
          )}
        </TouchableOpacity>

        {newFile && uploadedUrl && (
          <TouchableOpacity style={s.previewBtn} onPress={() => Alert.alert('Preview', `${newFile.name} is ready to preview once replaced.`)}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={s.previewBtnText}>Preview replacement</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.replaceBtn, (!newFile || !uploadedUrl || busy) && { opacity: 0.45 }]}
          disabled={!newFile || !uploadedUrl || busy}
          onPress={() => setConfirming(true)}
        >
          <Text style={s.replaceBtnText}>Replace PDF</Text>
        </TouchableOpacity>
      </ScrollView>

      {confirming && (
        <View style={s.overlay}>
          <View style={s.confirmCard}>
            <Ionicons name="warning-outline" size={28} color="#F59E0B" style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
            <Text style={s.confirmTitle}>Replace the current PDF?</Text>
            <Text style={s.confirmBody}>
              The newly uploaded file will replace the current PDF. Your PDF title, cover, price, public link, sales history and analytics will remain unchanged.
            </Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.confirmCancel} onPress={() => setConfirming(false)}>
                <Text style={s.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmOk} onPress={confirmReplace} disabled={busy}>
                <Text style={s.confirmOkText}>{busy ? 'Replacing…' : 'Replace PDF'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: 60 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  fileName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  fileMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  uploadBox: { alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.xs, backgroundColor: '#FFF8F5' },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  uploadSub: { fontSize: 11, color: colors.textSecondary },
  uploadedName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadedSize: { fontSize: 11, color: colors.textSecondary },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  previewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  replaceBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  replaceBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  confirmCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, width: '100%' },
  confirmTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  confirmBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  confirmCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  confirmCancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  confirmOk: { flex: 1.3, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primary },
  confirmOkText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
