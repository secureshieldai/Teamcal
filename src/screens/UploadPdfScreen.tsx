import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, spacing } from '../theme';
import {
  StepBar, WizardHeader, WizardNav, Field, CategoryDropdown,
  BuyerPreviewSettings, CoverPicker, ps,
} from './earn/pdf/PdfWizardShared';
import type { BuyerPreviewType } from './earn/pdf/pdfData';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadPdf'>;
const STEPS = ['Upload', 'Details', 'Publish'];

export default function UploadPdfScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 0
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [price, setPrice] = useState('9.99');
  const [isFree, setIsFree] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [addToShowcase, setAddToShowcase] = useState(false);

  // Step 2 – Buyer Preview
  const [previewType, setPreviewType] = useState<BuyerPreviewType>('first-pages');
  const [previewPages, setPreviewPages] = useState('5');
  const [specificPages, setSpecificPages] = useState('');
  const [customContent, setCustomContent] = useState('');

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const sizeMb = (asset.size ?? 0) / 1048576;
    if (sizeMb > 100) return Alert.alert('File too large', 'Maximum file size is 100MB.');
    setFileUri(asset.uri);
    setFileName(asset.name);
    setFileSize(asset.size ?? 0);
    setBusy(true);
    try {
      const uploaded = await earnService.uploadPdf({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setUploadedUrl(uploaded.fileUrl);
      if (!title) setTitle(asset.name.replace('.pdf', '').replace(/[-_]/g, ' '));
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const next = () => {
    if (step === 0 && !fileUri) return Alert.alert('PDF required', 'Please select a PDF file first.');
    if (step === 1 && !title.trim()) return Alert.alert('Title required');
    if (step === 1 && !category) return Alert.alert('Category required');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'pdf', subtype: 'upload',
        title: title.trim(), description,
        price: isFree ? 0 : Number(price) || 0,
        currency: 'USD',
        image: coverUri || undefined,
        status,
        metadata: {
          fileUrl: uploadedUrl || fileUri,
          fileName, fileSize, category,
          pricingModel: isFree ? 'free' : 'one-time',
          previewMode: previewType,
          previewPages: previewType === 'first-pages' ? Number(previewPages) || 5 : undefined,
          specificPages: previewType === 'specific-pages' ? specificPages : undefined,
          customPreviewContent: previewType === 'custom-content' ? customContent : undefined,
          downloadsEnabled: allowDownloads,
          addToShowcase,
        },
      });
      navigation.replace('PdfDashboard', { pdfId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <WizardHeader title="Upload PDF" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={ps.chapterContent}>
          <Text style={s.stepTitle}>Upload your PDF</Text>
          <Text style={s.stepSub}>Drag & drop your PDF here or choose a file. Max file size: 100MB.</Text>

          <TouchableOpacity style={s.uploadBox} onPress={pickPdf}>
            {fileUri ? (
              <>
                <Ionicons name="checkmark-circle" size={44} color={colors.success} />
                <Text style={s.uploadedName}>{fileName}</Text>
                <Text style={s.uploadedSize}>{(fileSize / 1048576).toFixed(1)} MB</Text>
                {busy && <Text style={s.uploadingText}>Uploading…</Text>}
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={44} color={colors.primary} />
                <Text style={s.uploadTitle}>Upload your PDF</Text>
                <Text style={s.uploadSub}>Drag & drop your PDF here</Text>
                <Text style={s.uploadOr}>or</Text>
                <TouchableOpacity style={s.chooseBtn} onPress={pickPdf}>
                  <Text style={s.chooseBtnText}>Choose File</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>

          {fileUri && (
            <TouchableOpacity style={s.changeLink} onPress={pickPdf}>
              <Text style={s.changeLinkText}>Change file</Text>
            </TouchableOpacity>
          )}

          <View style={s.requirementsBox}>
            <Text style={s.requirementsTitle}>Requirements</Text>
            <View style={s.requirementRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={s.requirementText}>File type: PDF only</Text>
            </View>
            <View style={s.requirementRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={s.requirementText}>Max file size: 100MB</Text>
            </View>
          </View>
          <Text style={s.note}>Your PDF will be securely stored and available for preview by buyers.</Text>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Field label="Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} placeholder="Enter description (optional)" />
          <CategoryDropdown value={category} onChange={setCategory} />

          <CoverPicker uri={coverUri} onPick={pickCover} />

          <Text style={ps.fieldLabel}>Price (USD)</Text>
          <View style={s.priceRow}>
            <Text style={s.priceCurrency}>$</Text>
            <View style={{ flex: 1 }}>
              <Field label="" value={isFree ? '0.00' : price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
            </View>
          </View>

          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Make it free</Text>
            <Switch value={isFree} onValueChange={setIsFree} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Allow downloads</Text>
            <Switch value={allowDownloads} onValueChange={setAllowDownloads} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Add to my showcase</Text>
            <Switch value={addToShowcase} onValueChange={setAddToShowcase} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <BuyerPreviewSettings
              previewType={previewType} onPreviewType={setPreviewType}
              previewPages={previewPages} onPreviewPages={setPreviewPages}
              specificPages={specificPages} onSpecificPages={setSpecificPages}
              customContent={customContent} onCustomContent={setCustomContent}
            />
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={ps.chapterContent}>
          <View style={s.publishReady}>
            <View style={s.publishCheckCircle}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={s.publishReadyTitle}>Ready to Publish!</Text>
            <Text style={s.publishReadySub}>Review your PDF details before publishing.</Text>
          </View>
          <View style={s.summaryCard}>
            {[
              { label: 'Title', value: title },
              { label: 'Category', value: category },
              { label: 'Price', value: isFree ? 'Free' : `$${price} USD` },
              { label: 'File', value: fileName },
              { label: 'Buyer Preview', value: previewType === 'first-pages' ? `First ${previewPages} pages` : previewType === 'specific-pages' ? `Pages: ${specificPages}` : previewType === 'custom-content' ? 'Custom content' : 'No preview' },
            ].map(row => (
              <View key={row.label} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{row.label}</Text>
                <Text style={s.summaryValue} numberOfLines={2}>{row.value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.publishBtn} onPress={() => publish('published')} disabled={busy}>
            <Text style={s.publishBtnText}>{busy ? 'Publishing…' : 'Publish PDF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.draftBtn} onPress={() => publish('draft')} disabled={busy}>
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step < STEPS.length - 1 && (
        <WizardNav onBack={step > 0 ? () => setStep(st => st - 1) : undefined} onNext={next} nextDisabled={busy} loading={busy} nextLabel={step === 1 ? 'Next: Preview' : 'Next'} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  stepSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.lg },
  uploadBox: { alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl * 1.5, gap: spacing.sm, backgroundColor: '#FFF8F5', marginBottom: spacing.md },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  uploadSub: { fontSize: 12, color: colors.textSecondary },
  uploadOr: { fontSize: 12, color: colors.textMuted },
  uploadedName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadedSize: { fontSize: 11, color: colors.textSecondary },
  uploadingText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  chooseBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  chooseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  changeLink: { alignItems: 'center', marginBottom: spacing.md },
  changeLinkText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  requirementsBox: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  requirementsTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  requirementText: { fontSize: 12, color: colors.textSecondary },
  note: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  priceCurrency: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, paddingBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  publishReady: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  publishCheckCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  publishReadyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  publishReadySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  summaryCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { width: 110, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryValue: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  publishBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
