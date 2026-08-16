import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, shadow, spacing } from '../theme';
import {
  StepBar, WizardHeader, WizardNav, Field, CategoryDropdown,
  LanguageDropdown, ThumbnailPicker, MonetizationStep, PreviewStep, sw,
} from './earn/video/VideoWizardShared';
import type { MonetizationType, PreviewType } from './earn/video/videoData';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportFromCloud'>;
const STEPS = ['Import', 'Details', 'Monetization', 'Preview'];

type CloudProvider = { key: string; label: string; icon: string; color: string; connectUrl: string };

const CLOUD_PROVIDERS: CloudProvider[] = [
  { key: 'google-drive', label: 'Google Drive', icon: 'logo-google', color: '#4285F4', connectUrl: 'https://drive.google.com' },
  { key: 'dropbox', label: 'Dropbox', icon: 'cloud-outline', color: '#0061FF', connectUrl: 'https://www.dropbox.com' },
  { key: 'onedrive', label: 'OneDrive', icon: 'cloud-outline', color: '#0078D4', connectUrl: 'https://onedrive.live.com' },
  { key: 'icloud', label: 'iCloud Drive', icon: 'cloud-outline', color: '#3478F6', connectUrl: 'https://icloud.com' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000', connectUrl: 'https://youtube.com' },
  { key: 'vimeo', label: 'Vimeo', icon: 'videocam-outline', color: '#1AB7EA', connectUrl: 'https://vimeo.com' },
  { key: 'url', label: 'Video URL', icon: 'link-outline', color: '#8B8D97', connectUrl: '' },
];

export default function ImportFromCloudScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1 – Import
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState('');
  const [importedFileName, setImportedFileName] = useState('');

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

  const pickThumbnail = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled) setThumbnailUri(r.assets[0].uri);
  };

  const pickPreview = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime'] });
    if (!result.canceled) setPreviewFileUri(result.assets[0].uri);
  };

  const handleProviderSelect = async (provider: CloudProvider) => {
    setSelectedProvider(provider.key);
    if (provider.key === 'url') return; // handled via text input
    // For cloud providers: open their web page / OAuth. In production this would
    // use a proper SDK or WebView OAuth flow. Here we open the provider site.
    if (provider.connectUrl) {
      await Linking.openURL(provider.connectUrl);
    }
  };

  const handleUrlImport = () => {
    if (!videoUrl.trim()) return Alert.alert('URL required', 'Please paste a video URL.');
    const name = videoUrl.split('/').pop() ?? 'imported-video';
    setImportedFileName(name);
    Alert.alert('URL added', `Video URL saved: ${name}`);
  };

  const next = () => {
    if (step === 0 && !selectedProvider) return Alert.alert('Select a source', 'Choose where to import from.');
    if (step === 0 && selectedProvider === 'url' && !videoUrl.trim()) return Alert.alert('URL required', 'Please paste a video URL.');
    if (step === 1 && !title.trim()) return Alert.alert('Title required');
    if (step === 1 && !category) return Alert.alert('Category required');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'video', subtype: 'import',
        title: title.trim(), description,
        price: monetization === 'paid' || monetization === 'ppv' ? Number(price) || 0 : 0,
        currency: 'USD', image: thumbnailUri || undefined, status,
        metadata: {
          importSource: selectedProvider,
          fileUrl: videoUrl || undefined,
          fileName: importedFileName || undefined,
          category, tags: tags.split(',').map(t => t.trim()).filter(Boolean), language,
          monetization,
          previewType, previewCustomStart: customStart ? Number(customStart) : undefined,
          previewCustomEnd: customEnd ? Number(customEnd) : undefined,
          previewFileUrl: previewFileUri || undefined,
          commentsEnabled: allowComments, sharingEnabled: allowLikes, addToShowcase, dropContent,
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
      <WizardHeader title="Import from Cloud" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Choose Source</Text>
          <Text style={sw.stepSub}>Select a cloud provider or paste a video URL.</Text>

          <View style={s.providerGrid}>
            {CLOUD_PROVIDERS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.providerCard, shadow.soft, selectedProvider === p.key && s.providerCardActive]}
                onPress={() => handleProviderSelect(p)}
                activeOpacity={0.75}
              >
                <View style={[s.providerIcon, { backgroundColor: p.color }]}>
                  <Ionicons name={p.icon as any} size={22} color="#fff" />
                </View>
                <Text style={s.providerLabel}>{p.label}</Text>
                {selectedProvider === p.key && (
                  <View style={s.providerCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedProvider === 'url' && (
            <View style={s.urlBox}>
              <Text style={sw.fieldLabel}>Paste Video URL</Text>
              <View style={s.urlRow}>
                <TextInput
                  style={[sw.input, { flex: 1 }]}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://example.com/video.mp4"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity style={s.importBtn} onPress={handleUrlImport}>
                  <Text style={s.importBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {importedFileName ? (
                <View style={s.importedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={s.importedBadgeText}>{importedFileName}</Text>
                </View>
              ) : null}
            </View>
          )}

          {selectedProvider && selectedProvider !== 'url' && (
            <View style={[s.connectedBanner, shadow.soft]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={s.connectedText}>
                {CLOUD_PROVIDERS.find(p => p.key === selectedProvider)?.label} opened. Select your video there and return here to continue.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Video Details</Text>
          <Text style={sw.stepSub}>Add details for the imported video.</Text>
          <Field label="Video Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
          <CategoryDropdown value={category} onChange={setCategory} />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="health, tips, mindset" maxLength={100} />
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
        ? <WizardNav onBack={step > 0 ? () => setStep(st => st - 1) : undefined} onNext={next} nextDisabled={busy} loading={busy} />
        : (
          <View style={sw.navRow}>
            <TouchableOpacity style={sw.backBtn} onPress={() => setStep(st => st - 1)}>
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
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  providerCard: { width: '30%', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderColor: colors.border },
  providerCardActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  providerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  providerLabel: { fontSize: 10, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  providerCheck: { position: 'absolute', top: 6, right: 6 },
  urlBox: { marginTop: spacing.lg },
  urlRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  importBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  importBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  importedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  importedBadgeText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  connectedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#E6F9F0', borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.lg },
  connectedText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 18 },
});
