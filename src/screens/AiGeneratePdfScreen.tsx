import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { coachService } from '../services/api/coach.service';
import { colors, radii, spacing } from '../theme';
import {
  StepBar, WizardHeader, WizardNav, Field, CategoryDropdown,
  BuyerPreviewSettings, CoverPicker, ChapterEditor, ChapterList, ps,
} from './earn/pdf/PdfWizardShared';
import { AI_TONES, AI_LENGTHS, type BuyerPreviewType, type Chapter } from './earn/pdf/pdfData';

type Props = NativeStackScreenProps<RootStackParamList, 'AiGeneratePdf'>;
const STEPS = ['Prompt', 'Preview', 'Publish'];

export default function AiGeneratePdfScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Step 0 – Prompt
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState<typeof AI_LENGTHS[number]>(AI_LENGTHS[1]);
  const [category, setCategory] = useState('');
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeChapters, setIncludeChapters] = useState(true);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeFaqs, setIncludeFaqs] = useState(false);
  const [includeReferences, setIncludeReferences] = useState(false);

  // Generated content
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Step 2 – Publish
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [price, setPrice] = useState('9.99');
  const [isFree, setIsFree] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [previewType, setPreviewType] = useState<BuyerPreviewType>('first-pages');
  const [previewPages, setPreviewPages] = useState('5');
  const [specificPages, setSpecificPages] = useState('');
  const [customContent, setCustomContent] = useState('');

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const generateContent = async () => {
    if (!prompt.trim()) return Alert.alert('Description required', 'Tell the AI what your PDF should be about.');
    if (!category) return Alert.alert('Category required');
    setGenerating(true);
    try {
      // Generate outline first
      const outlineResult = await coachService.generateArticleContent({
        action: 'outline',
        topic: prompt,
        instructions: `Tone: ${tone}. Length: ${length}. Include: ${[includeIntro && 'introduction', includeChapters && 'chapters', includeConclusion && 'conclusion', includeFaqs && 'FAQs', includeReferences && 'references'].filter(Boolean).join(', ')}.`,
      });

      // Generate title suggestions
      const titlesResult = await coachService.generateArticleContent({ action: 'titles', topic: prompt });
      const suggestedTitle = titlesResult.titles?.[0] || prompt;
      setGeneratedTitle(suggestedTitle);
      setTitle(suggestedTitle);

      // Build chapters from outline
      const outlineText = outlineResult.text || '';
      const lines = outlineText.split('\n').filter(l => l.trim().match(/^[\d#\-\*]/));
      const chapterTitles = lines.slice(0, 6).map(l => l.replace(/^[\d\.#\-\*\s]+/, '').trim()).filter(Boolean);

      if (chapterTitles.length === 0) chapterTitles.push('Introduction', 'Main Content', 'Conclusion');

      const generatedChapters: Chapter[] = [];
      for (const chTitle of chapterTitles) {
        const contentResult = await coachService.generateArticleContent({
          action: 'write',
          topic: `${chTitle} — for a ${tone.toLowerCase()} PDF about: ${prompt}`,
        });
        generatedChapters.push({
          id: `ch-${Date.now()}-${Math.random()}`,
          title: chTitle,
          content: contentResult.text || `Content for ${chTitle}`,
          images: [],
        });
      }

      setChapters(generatedChapters);
      setStep(1);
    } catch (e) {
      Alert.alert('Generation failed', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const openEditChapter = (id: string) => {
    const ch = chapters.find(c => c.id === id);
    if (ch) setEditingChapter(ch);
  };

  const saveChapter = (ch: Chapter) => {
    setChapters(prev => prev.map(c => c.id === ch.id ? ch : c));
    setEditingChapter(null);
  };

  const removeChapter = (id: string) => setChapters(prev => prev.filter(c => c.id !== id));

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'pdf', subtype: 'ai',
        title: (title || generatedTitle).trim(),
        description,
        price: isFree ? 0 : Number(price) || 0,
        currency: 'USD', image: coverUri || undefined, status,
        metadata: {
          category, prompt, tone, length,
          chapters: chapters.map((ch, i) => ({ ...ch, order: i + 1 })),
          pricingModel: isFree ? 'free' : 'one-time',
          previewMode: previewType,
          previewPages: previewType === 'first-pages' ? Number(previewPages) || 5 : undefined,
          specificPages: previewType === 'specific-pages' ? specificPages : undefined,
          customPreviewContent: previewType === 'custom-content' ? customContent : undefined,
          downloadsEnabled: allowDownloads,
        },
      });
      navigation.replace('PdfDashboard', { pdfId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (editingChapter) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ChapterEditor chapter={editingChapter} onSave={saveChapter} onCancel={() => setEditingChapter(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <WizardHeader title="AI Generate PDF" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Text style={s.stepSub}>Tell the AI what you want your PDF to be about.</Text>
          <Field
            label="Describe your PDF"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={1000}
            placeholder="Example: A complete guide on intermittent fasting. Include meal plans, benefits, and tips."
            required
          />
          <CategoryDropdown value={category} onChange={setCategory} />

          <Text style={ps.fieldLabel}>Tone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
            {AI_TONES.map(t => (
              <TouchableOpacity key={t} style={[s.chipBtn, tone === t && s.chipBtnActive]} onPress={() => setTone(t)}>
                <Text style={[s.chipBtnText, tone === t && s.chipBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={ps.fieldLabel}>Length</Text>
          <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
            {AI_LENGTHS.map(l => (
              <TouchableOpacity key={l} style={s.lengthRow} onPress={() => setLength(l)}>
                <View style={[ps.radio, length === l && ps.radioActive]}>
                  {length === l && <View style={ps.radioDot} />}
                </View>
                <Text style={s.lengthText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ps.fieldLabel}>Include</Text>
          {[
            { label: 'Introduction', value: includeIntro, set: setIncludeIntro },
            { label: 'Chapters', value: includeChapters, set: setIncludeChapters },
            { label: 'Conclusion', value: includeConclusion, set: setIncludeConclusion },
            { label: 'References', value: includeReferences, set: setIncludeReferences },
            { label: 'FAQs', value: includeFaqs, set: setIncludeFaqs },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.includeRow} onPress={() => item.set(!item.value)}>
              <View style={[s.includeCheck, item.value && s.includeCheckActive]}>
                {item.value && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={s.includeLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <BuyerPreviewSettings
            previewType={previewType} onPreviewType={setPreviewType}
            previewPages={previewPages} onPreviewPages={setPreviewPages}
            specificPages={specificPages} onSpecificPages={setSpecificPages}
            customContent={customContent} onCustomContent={setCustomContent}
          />

          <TouchableOpacity
            style={[s.generateBtn, (!prompt.trim() || !category || generating) && { opacity: 0.5 }]}
            onPress={generateContent}
            disabled={!prompt.trim() || !category || generating}
          >
            {generating
              ? <><ActivityIndicator color="#fff" size="small" /><Text style={s.generateBtnText}>Generating…</Text></>
              : <><Ionicons name="sparkles-outline" size={18} color="#fff" /><Text style={s.generateBtnText}>Generate Content</Text></>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>{generatedTitle}</Text>
          <Text style={s.stepSub}>Review and edit your AI-generated content before publishing.</Text>
          <ChapterList
            chapters={chapters}
            onEdit={openEditChapter}
            onRemove={removeChapter}
            onAdd={() => setChapters(prev => [...prev, { id: `ch-${Date.now()}`, title: `Chapter ${prev.length + 1}`, content: '', images: [] }])}
          />
          <WizardNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Next: Publish" />
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
          <Field label="Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
          <CategoryDropdown value={category} onChange={setCategory} />
          <CoverPicker uri={coverUri} onPick={pickCover} />
          <Field label="Price (USD)" value={isFree ? '0.00' : price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Make it free</Text>
            <Switch value={isFree} onValueChange={setIsFree} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Allow downloads</Text>
            <Switch value={allowDownloads} onValueChange={setAllowDownloads} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <TouchableOpacity style={[s.generateBtn, { marginTop: spacing.xl }]} onPress={() => publish('published')} disabled={busy}>
            <Text style={s.generateBtnText}>{busy ? 'Publishing…' : 'Publish PDF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.draftBtn, { marginTop: spacing.sm }]} onPress={() => publish('draft')} disabled={busy}>
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  stepTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  stepSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.lg },
  chipBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  chipBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipBtnTextActive: { color: colors.primary },
  lengthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  lengthText: { fontSize: 13, color: colors.textPrimary },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  includeCheck: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  includeCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  includeLabel: { fontSize: 13, color: colors.textPrimary },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, marginTop: spacing.lg },
  generateBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
