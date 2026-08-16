import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSeries'>;
const STEPS = ['Series Info', 'Episodes', 'Monetization', 'Preview'];

type Episode = { id: string; title: string; description: string; fileUri: string; fileName: string; uploadedUrl: string; uploading: boolean };

export default function CreateSeriesScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1 – Series Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('English');
  const [thumbnailUri, setThumbnailUri] = useState('');
  const [seriesType, setSeriesType] = useState<'standard' | 'multi-season'>('standard');

  // Step 2 – Episodes
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Step 3 – Monetization
  const [monetization, setMonetization] = useState<MonetizationType>('paid');
  const [price, setPrice] = useState('9.99');
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

  const addEpisode = () => {
    setEpisodes(prev => [...prev, {
      id: `ep-${Date.now()}`, title: `Episode ${prev.length + 1}`, description: '',
      fileUri: '', fileName: '', uploadedUrl: '', uploading: false,
    }]);
  };

  const updateEpisode = (id: string, patch: Partial<Episode>) =>
    setEpisodes(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  const removeEpisode = (id: string) => setEpisodes(prev => prev.filter(e => e.id !== id));

  const pickEpisodeVideo = async (id: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime', 'video/webm'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    updateEpisode(id, { fileUri: asset.uri, fileName: asset.name, uploading: true });
    try {
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      updateEpisode(id, { uploading: false, uploadedUrl: uploaded.fileUrl });
    } catch (e) {
      updateEpisode(id, { uploading: false });
      Alert.alert('Upload failed', (e as Error).message);
    }
  };

  const pickPreview = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime'] });
    if (!result.canceled) setPreviewFileUri(result.assets[0].uri);
  };

  const next = () => {
    if (step === 0 && !title.trim()) return Alert.alert('Title required');
    if (step === 0 && !category) return Alert.alert('Category required');
    if (step === 1 && episodes.length === 0) return Alert.alert('Episodes required', 'Add at least one episode.');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'video',
        subtype: seriesType === 'multi-season' ? 'multi-season' : 'series',
        title: title.trim(),
        description,
        price: monetization === 'paid' || monetization === 'ppv' ? Number(price) || 0 : 0,
        currency: 'USD',
        image: thumbnailUri || undefined,
        status,
        metadata: {
          category, tags: tags.split(',').map(t => t.trim()).filter(Boolean), language,
          monetization, seriesName: title,
          episodes: episodes.map((e, i) => ({
            id: e.id, title: e.title, description: e.description,
            episode: i + 1, fileUrl: e.uploadedUrl || e.fileUri,
          })),
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
      <WizardHeader title="Create Series" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Series Information</Text>
          <Text style={sw.stepSub}>Set up your video series details.</Text>

          <Text style={sw.fieldLabel}>Series Type</Text>
          <View style={s.typeRow}>
            {(['standard', 'multi-season'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, seriesType === t && s.typeBtnActive]} onPress={() => setSeriesType(t)}>
                <Ionicons name={t === 'standard' ? 'film-outline' : 'albums-outline'} size={18} color={seriesType === t ? colors.primary : colors.textSecondary} />
                <Text style={[s.typeBtnText, seriesType === t && s.typeBtnTextActive]}>
                  {t === 'standard' ? 'Standard Series' : 'Multi-Season'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Series Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
          <CategoryDropdown value={category} onChange={setCategory} />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="fitness, education, health" maxLength={100} />
          <LanguageDropdown value={language} onChange={setLanguage} />
          <ThumbnailPicker uri={thumbnailUri} onPick={pickThumbnail} />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Episodes</Text>
          <Text style={sw.stepSub}>Add and manage your series episodes.</Text>

          {episodes.map((ep, i) => (
            <View key={ep.id} style={[s.episodeCard, shadow.soft]}>
              <View style={s.episodeHeader}>
                <View style={s.episodeNumBadge}>
                  <Text style={s.episodeNum}>{i + 1}</Text>
                </View>
                <Text style={s.episodeLabel}>Episode {i + 1}</Text>
                <TouchableOpacity onPress={() => removeEpisode(ep.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Field label="Episode Title" value={ep.title} onChangeText={v => updateEpisode(ep.id, { title: v })} maxLength={80} />
              <Field label="Description" value={ep.description} onChangeText={v => updateEpisode(ep.id, { description: v })} multiline maxLength={300} />
              <TouchableOpacity style={s.episodePickBtn} onPress={() => pickEpisodeVideo(ep.id)}>
                <Ionicons name={ep.uploading ? 'cloud-upload-outline' : ep.uploadedUrl ? 'checkmark-circle' : 'videocam-outline'} size={18} color={ep.uploadedUrl ? colors.success : colors.primary} />
                <Text style={s.episodePickText}>
                  {ep.uploading ? 'Uploading…' : ep.uploadedUrl ? `✓ ${ep.fileName}` : 'Attach Video'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={s.addEpisodeBtn} onPress={addEpisode}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={s.addEpisodeBtnText}>Add Episode</Text>
          </TouchableOpacity>
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
              <Text style={sw.nextBtnText}>{busy ? 'Publishing…' : 'Publish Series'}</Text>
            </TouchableOpacity>
          </View>
        )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, backgroundColor: colors.card },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  typeBtnTextActive: { color: colors.primary },
  episodeCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  episodeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  episodeNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  episodeNum: { fontSize: 12, fontWeight: '800', color: colors.primary },
  episodeLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  episodePickBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.xs },
  episodePickText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  addEpisodeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.lg, backgroundColor: '#FFF8F5' },
  addEpisodeBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
