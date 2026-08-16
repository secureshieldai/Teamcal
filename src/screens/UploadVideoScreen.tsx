import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  LanguageDropdown, ThumbnailPicker, MonetizationStep, PreviewStep, PublishStep, sw,
} from './earn/video/VideoWizardShared';
import type { MonetizationType, PreviewType } from './earn/video/videoData';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadVideo'>;
const STEPS = ['Video', 'Details', 'Monetization', 'Preview'];

export default function UploadVideoScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1 – Video
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [orientation, setOrientation] = useState<'auto' | 'landscape' | 'portrait' | 'square'>('auto');
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Step 2 – Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('English');
  const [thumbnailUri, setThumbnailUri] = useState('');

  // Step 3 – Monetization
  const [monetization, setMonetization] = useState<MonetizationType>('paid');
  const [price, setPrice] = useState('4.99');
  const [allowComments, setAllowComments] = useState(true);
  const [allowLikes, setAllowLikes] = useState(true);
  const [addToShowcase, setAddToShowcase] = useState(false);
  const [dropContent, setDropContent] = useState(false);

  // Step 4 – Preview
  const [previewType, setPreviewType] = useState<PreviewType>('first-30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [previewFileUri, setPreviewFileUri] = useState('');

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.size ?? 0) > 500 * 1024 * 1024) return Alert.alert('File too large', 'Maximum video size is 500MB.');
    setFileUri(asset.uri);
    setFileName(asset.name);
    setFileSize(asset.size ?? 0);
    setBusy(true);
    try {
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setUploadedUrl(uploaded.fileUrl);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setThumbnailUri(result.assets[0].uri);
  };

  const pickPreview = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime'] });
    if (!result.canceled) setPreviewFileUri(result.assets[0].uri);
  };

  const next = () => {
    if (step === 0 && !fileUri) return Alert.alert('Video required', 'Please choose a video file first.');
    if (step === 1 && !title.trim()) return Alert.alert('Title required');
    if (step === 1 && !category) return Alert.alert('Category required');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'video',
        subtype: 'upload',
        title: title.trim(),
        description,
        price: monetization === 'paid' || monetization === 'ppv' ? Number(price) || 0 : 0,
        currency: 'USD',
        image: thumbnailUri || undefined,
        status,
        metadata: {
          fileUrl: uploadedUrl || fileUri,
          fileName,
          fileSize,
          orientation,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          language,
          monetization,
          earnPerCompleteRate: monetization === 'earn-per-complete' ? Number(price) : undefined,
          previewType,
          previewCustomStart: customStart ? Number(customStart) : undefined,
          previewCustomEnd: customEnd ? Number(customEnd) : undefined,
          previewFileUrl: previewFileUri || undefined,
          commentsEnabled: allowComments,
          sharingEnabled: allowLikes,
          addToShowcase,
          dropContent,
        },
      });
      navigation.replace('VideoDashboard', { videoId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <WizardHeader title="Upload Video" onBack={() => step === 0 ? navigation.goBack() : setStep(s => s - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Upload Video</Text>
          <Text style={sw.stepSub}>Upload MP4, MOV, WebM or M4V in any orientation. Max 500MB.</Text>

          <TouchableOpacity style={s.uploadBox} onPress={pickVideo}>
            {fileUri ? (
              <>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={s.uploadedName}>{fileName}</Text>
                <Text style={s.uploadedSize}>{(fileSize / 1048576).toFixed(1)} MB</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={44} color={colors.primary} />
                <Text style={s.uploadTitle}>Upload your video</Text>
                <Text style={s.uploadSub}>MP4, MOV, WebM, M4V · Max 500MB{'\n'}Any orientation supported</Text>
                <TouchableOpacity style={s.chooseBtn} onPress={pickVideo}>
                  <Text style={s.chooseBtnText}>Choose File</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>

          {fileUri && (
            <TouchableOpacity style={s.changeBtn} onPress={pickVideo}>
              <Text style={s.changeBtnText}>Change video</Text>
            </TouchableOpacity>
          )}

          <Text style={[sw.fieldLabel, { marginTop: spacing.lg }]}>Orientation</Text>
          <View style={s.orientationRow}>
            {(['auto', 'landscape', 'portrait', 'square'] as const).map(o => (
              <TouchableOpacity
                key={o}
                style={[s.orientBtn, orientation === o && s.orientBtnActive]}
                onPress={() => setOrientation(o)}
              >
                <Text style={[s.orientBtnText, orientation === o && s.orientBtnTextActive]}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.formatsRow}>
            {['MP4', 'MOV', 'WEBM', 'M4V'].map(f => (
              <View key={f} style={s.formatBadge}>
                <Text style={s.formatText}>{f}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Video Details</Text>
          <Text style={sw.stepSub}>Add all necessary details about your video.</Text>
          <Field label="Video Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
          <CategoryDropdown value={category} onChange={setCategory} />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="mindset, motivation, success" maxLength={100} />
          <LanguageDropdown value={language} onChange={setLanguage} />
          <ThumbnailPicker uri={thumbnailUri} onPick={pickThumbnail} />
        </ScrollView>
      )}

      {step === 2 && (
        <MonetizationStep
          selected={monetization} onSelect={setMonetization}
          price={price} onPrice={setPrice}
          allowComments={allowComments} onAllowComments={setAllowComments}
          allowLikes={allowLikes} onAllowLikes={setAllowLikes}
          addToShowcase={addToShowcase} onAddToShowcase={setAddToShowcase}
          dropContent={dropContent} onDropContent={setDropContent}
        />
      )}

      {step === 3 && (
        <PreviewStep
          previewType={previewType} onPreviewType={setPreviewType}
          customStart={customStart} onCustomStart={setCustomStart}
          customEnd={customEnd} onCustomEnd={setCustomEnd}
          previewFileUri={previewFileUri} onPickPreview={pickPreview}
          allowComments={allowComments} onAllowComments={setAllowComments}
          allowLikes={allowLikes} onAllowLikes={setAllowLikes}
          addToShowcase={addToShowcase} onAddToShowcase={setAddToShowcase}
          dropContent={dropContent} onDropContent={setDropContent}
        />
      )}

      {step < STEPS.length - 1
        ? <WizardNav onBack={step > 0 ? () => setStep(s => s - 1) : undefined} onNext={next} nextDisabled={busy} loading={busy} />
        : (
          <View style={sw.navRow}>
            <TouchableOpacity style={sw.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={sw.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sw.nextBtn} onPress={() => publish('published')} disabled={busy}>
              <Text style={sw.nextBtnText}>{busy ? 'Publishing…' : 'Publish Video'}</Text>
            </TouchableOpacity>
          </View>
        )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  uploadBox: { alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.sm, backgroundColor: '#FFF8F5', marginBottom: spacing.md },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  uploadSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  uploadedName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadedSize: { fontSize: 11, color: colors.textSecondary },
  chooseBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  chooseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  changeBtn: { alignItems: 'center', marginBottom: spacing.md },
  changeBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  orientationRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  orientBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.card },
  orientBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  orientBtnText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  orientBtnTextActive: { color: colors.primary },
  formatsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  formatBadge: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.card },
  formatText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
});
