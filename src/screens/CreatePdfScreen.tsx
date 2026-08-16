import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, shadow, spacing } from '../theme';
import {
  StepBar, WizardHeader, WizardNav, Field, CategoryDropdown,
  BuyerPreviewSettings, CoverPicker, ChapterEditor, ChapterList, ps,
} from './earn/pdf/PdfWizardShared';
import type { BuyerPreviewType, Chapter } from './earn/pdf/pdfData';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePdf'>;
const STEPS = ['Content', 'Preview', 'Publish'];

export default function CreatePdfScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Content
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Chapter editor state
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Preview/Publish settings
  const [coverUri, setCoverUri] = useState('');
  const [price, setPrice] = useState('9.99');
  const [isFree, setIsFree] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [addToShowcase, setAddToShowcase] = useState(false);
  const [previewType, setPreviewType] = useState<BuyerPreviewType>('first-pages');
  const [previewPages, setPreviewPages] = useState('5');
  const [specificPages, setSpecificPages] = useState('');
  const [customContent, setCustomContent] = useState('');

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const openNewChapter = () => {
    setEditingChapter({ id: `ch-${Date.now()}`, title: '', content: '', images: [] });
  };

  const openEditChapter = (id: string) => {
    const ch = chapters.find(c => c.id === id);
    if (ch) setEditingChapter(ch);
  };

  const saveChapter = (ch: Chapter) => {
    setChapters(prev => {
      const exists = prev.find(c => c.id === ch.id);
      return exists ? prev.map(c => c.id === ch.id ? ch : c) : [...prev, ch];
    });
    setEditingChapter(null);
  };

  const removeChapter = (id: string) => {
    Alert.alert('Remove chapter?', 'This will delete the chapter and its content.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setChapters(prev => prev.filter(c => c.id !== id)) },
    ]);
  };

  const next = () => {
    if (step === 0 && !title.trim()) return Alert.alert('Title required');
    if (step === 0 && !category) return Alert.alert('Category required');
    if (step === 0 && chapters.length === 0) return Alert.alert('Content required', 'Add at least one chapter.');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'pdf', subtype: 'create',
        title: title.trim(), description,
        price: isFree ? 0 : Number(price) || 0,
        currency: 'USD', image: coverUri || undefined, status,
        metadata: {
          category,
          chapters: chapters.map((ch, i) => ({ ...ch, order: i + 1 })),
          pricingModel: isFree ? 'free' : 'one-time',
          previewMode: previewType,
          previewPages: previewType === 'first-pages' ? Number(previewPages) || 5 : undefined,
          specificPages: previewType === 'specific-pages' ? specificPages : undefined,
          customPreviewContent: previewType === 'custom-content' ? customContent : undefined,
          downloadsEnabled: allowDownloads, addToShowcase,
        },
      });
      navigation.replace('PdfDashboard', { pdfId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Show chapter editor as full-screen overlay
  if (editingChapter) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ChapterEditor
          chapter={editingChapter}
          onSave={saveChapter}
          onCancel={() => setEditingChapter(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <WizardHeader title="Create PDF" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Field label="Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} placeholder="Enter description (optional)" />
          <CategoryDropdown value={category} onChange={setCategory} />

          <Text style={[ps.fieldLabel, { marginTop: spacing.md }]}>Content</Text>
          <ChapterList
            chapters={chapters}
            onEdit={openEditChapter}
            onRemove={removeChapter}
            onAdd={openNewChapter}
          />

          <BuyerPreviewSection
            previewType={previewType} onPreviewType={setPreviewType}
            previewPages={previewPages} onPreviewPages={setPreviewPages}
            specificPages={specificPages} onSpecificPages={setSpecificPages}
            customContent={customContent} onCustomContent={setCustomContent}
          />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Preview</Text>
          <View style={[s.previewCard, shadow.card]}>
            <View style={s.previewCover}>
              {coverUri
                ? null
                : <Ionicons name="document-text-outline" size={40} color={colors.primary} />}
              <Text style={s.previewCoverTitle}>{title || 'Your PDF Title'}</Text>
              <Text style={s.previewCoverSub}>{description?.slice(0, 80) || 'A complete handbook'}</Text>
            </View>
            <Text style={s.previewPageCount}>Page 1 of {chapters.length}</Text>
          </View>

          <TouchableOpacity style={s.previewBuyerBtn} onPress={() => Alert.alert('Preview as Buyer', 'This shows what a buyer sees before purchasing.')}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={s.previewBuyerBtnText}>Preview as Buyer</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Publish Settings</Text>

          <CoverPicker uri={coverUri} onPick={pickCover} />

          <Text style={ps.fieldLabel}>File Name</Text>
          <Text style={s.fileNameText}>{title.toLowerCase().replace(/\s+/g, '-') || 'your-pdf-title'}.pdf</Text>

          <CategoryDropdown value={category} onChange={setCategory} />

          <Field label="Price (USD)" value={isFree ? '0.00' : price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="12.99" />

          <Text style={[ps.fieldLabel, { marginTop: spacing.sm }]}>Settings</Text>
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

          <TouchableOpacity style={[s.publishBtn, { marginTop: spacing.xl }]} onPress={() => publish('published')} disabled={busy}>
            <Text style={s.publishBtnText}>{busy ? 'Publishing…' : 'Publish PDF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.draftBtn} onPress={() => publish('draft')} disabled={busy}>
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step < STEPS.length - 1 && (
        <WizardNav onBack={step > 0 ? () => setStep(st => st - 1) : undefined} onNext={next} nextDisabled={busy} nextLabel={step === 0 ? 'Next: Preview' : 'Next: Publish'} />
      )}
    </SafeAreaView>
  );
}

function BuyerPreviewSection(props: {
  previewType: BuyerPreviewType; onPreviewType: (v: BuyerPreviewType) => void;
  previewPages: string; onPreviewPages: (v: string) => void;
  specificPages: string; onSpecificPages: (v: string) => void;
  customContent: string; onCustomContent: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={ps.fieldLabel}>Buyer Preview <Text style={ps.hint}>(What buyers can see)</Text></Text>
      <BuyerPreviewSettings {...props} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  previewCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  previewCover: { width: '100%', minHeight: 200, backgroundColor: '#FFF0E8', borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  previewCoverTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  previewCoverSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  previewPageCount: { fontSize: 11, color: colors.textMuted, marginTop: spacing.md },
  previewBuyerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginBottom: spacing.lg },
  previewBuyerBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  fileNameText: { fontSize: 12, color: colors.textSecondary, backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, fontFamily: 'monospace' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  publishBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
