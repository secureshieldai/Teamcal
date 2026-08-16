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

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCourse'>;
const STEPS = ['Course Info', 'Curriculum', 'Monetization', 'Preview'];

type Lesson = { id: string; title: string; description: string; fileUri: string; uploadedUrl: string; uploading: boolean; free: boolean };
type Module = { id: string; title: string; lessons: Lesson[] };

export default function CreateCourseScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('English');
  const [thumbnailUri, setThumbnailUri] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [requirements, setRequirements] = useState('');
  const [outcomes, setOutcomes] = useState('');

  // Step 2
  const [modules, setModules] = useState<Module[]>([
    { id: 'm1', title: 'Module 1', lessons: [] },
  ]);

  // Step 3
  const [monetization, setMonetization] = useState<MonetizationType>('paid');
  const [price, setPrice] = useState('29.99');
  const [allowComments, setAllowComments] = useState(true);
  const [allowLikes, setAllowLikes] = useState(true);
  const [addToShowcase, setAddToShowcase] = useState(false);
  const [dropContent, setDropContent] = useState(false);

  // Step 4
  const [previewType, setPreviewType] = useState<PreviewType>('first-30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [previewFileUri, setPreviewFileUri] = useState('');

  const pickThumbnail = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled) setThumbnailUri(r.assets[0].uri);
  };

  const addModule = () => setModules(prev => [...prev, { id: `m${Date.now()}`, title: `Module ${prev.length + 1}`, lessons: [] }]);
  const removeModule = (mid: string) => setModules(prev => prev.filter(m => m.id !== mid));
  const updateModule = (mid: string, title: string) => setModules(prev => prev.map(m => m.id === mid ? { ...m, title } : m));

  const addLesson = (mid: string) => setModules(prev => prev.map(m => m.id !== mid ? m : {
    ...m, lessons: [...m.lessons, { id: `l${Date.now()}`, title: `Lesson ${m.lessons.length + 1}`, description: '', fileUri: '', uploadedUrl: '', uploading: false, free: m.lessons.length === 0 }],
  }));

  const removeLesson = (mid: string, lid: string) => setModules(prev => prev.map(m => m.id !== mid ? m : { ...m, lessons: m.lessons.filter(l => l.id !== lid) }));

  const updateLesson = (mid: string, lid: string, patch: Partial<Lesson>) => setModules(prev => prev.map(m => m.id !== mid ? m : { ...m, lessons: m.lessons.map(l => l.id === lid ? { ...l, ...patch } : l) }));

  const pickLessonVideo = async (mid: string, lid: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime', 'video/webm'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    updateLesson(mid, lid, { fileUri: asset.uri, uploading: true });
    try {
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      updateLesson(mid, lid, { uploading: false, uploadedUrl: uploaded.fileUrl });
    } catch (e) {
      updateLesson(mid, lid, { uploading: false });
      Alert.alert('Upload failed', (e as Error).message);
    }
  };

  const pickPreview = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime'] });
    if (!result.canceled) setPreviewFileUri(result.assets[0].uri);
  };

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);

  const next = () => {
    if (step === 0 && !title.trim()) return Alert.alert('Title required');
    if (step === 0 && !category) return Alert.alert('Category required');
    if (step === 1 && totalLessons === 0) return Alert.alert('Curriculum required', 'Add at least one lesson.');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const episodes = modules.flatMap((m, mi) => m.lessons.map((l, li) => ({
        id: l.id, title: l.title, description: l.description,
        module: mi + 1, lesson: li + 1, free: l.free,
        fileUrl: l.uploadedUrl || l.fileUri,
      })));
      const asset = await earnService.createAsset({
        kind: 'video', subtype: 'course',
        title: title.trim(), description,
        price: monetization === 'paid' || monetization === 'ppv' ? Number(price) || 0 : 0,
        currency: 'USD', image: thumbnailUri || undefined, status,
        metadata: {
          category, tags: tags.split(',').map(t => t.trim()).filter(Boolean), language,
          targetAudience, requirements, outcomes,
          monetization, episodes,
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
      <WizardHeader title="Create Course" onBack={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} />
      <StepBar steps={STEPS} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Course Details</Text>
          <Text style={sw.stepSub}>Set up your course information.</Text>
          <Field label="Course Title" value={title} onChangeText={setTitle} maxLength={100} required />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={600} />
          <CategoryDropdown value={category} onChange={setCategory} />
          <Field label="Target Audience" value={targetAudience} onChangeText={setTargetAudience} placeholder="Who is this course for?" maxLength={200} />
          <Field label="Requirements" value={requirements} onChangeText={setRequirements} placeholder="What should students know before taking this?" multiline maxLength={300} />
          <Field label="Learning Outcomes" value={outcomes} onChangeText={setOutcomes} placeholder="What will students learn?" multiline maxLength={300} />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="marketing, productivity, health" maxLength={100} />
          <LanguageDropdown value={language} onChange={setLanguage} />
          <ThumbnailPicker uri={thumbnailUri} onPick={pickThumbnail} />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Curriculum</Text>
          <Text style={sw.stepSub}>{modules.length} modules · {totalLessons} lessons</Text>

          {modules.map((mod, mi) => (
            <View key={mod.id} style={[s.moduleCard, shadow.soft]}>
              <View style={s.moduleHeader}>
                <View style={s.moduleNumBadge}>
                  <Text style={s.moduleNum}>M{mi + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="" value={mod.title} onChangeText={v => updateModule(mod.id, v)} placeholder={`Module ${mi + 1} title`} />
                </View>
                <TouchableOpacity onPress={() => removeModule(mod.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {mod.lessons.map((lesson, li) => (
                <View key={lesson.id} style={s.lessonRow}>
                  <View style={s.lessonDot} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Field label="" value={lesson.title} onChangeText={v => updateLesson(mod.id, lesson.id, { title: v })} placeholder={`Lesson ${li + 1} title`} />
                    <TouchableOpacity style={s.lessonPickBtn} onPress={() => pickLessonVideo(mod.id, lesson.id)}>
                      <Ionicons name={lesson.uploading ? 'cloud-upload-outline' : lesson.uploadedUrl ? 'checkmark-circle' : 'attach-outline'} size={14} color={lesson.uploadedUrl ? colors.success : colors.primary} />
                      <Text style={s.lessonPickText}>{lesson.uploading ? 'Uploading…' : lesson.uploadedUrl ? 'Video attached' : 'Attach video'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.freeToggle} onPress={() => updateLesson(mod.id, lesson.id, { free: !lesson.free })}>
                      <Ionicons name={lesson.free ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={lesson.free ? colors.success : colors.textMuted} />
                      <Text style={s.freeToggleText}>{lesson.free ? 'Free preview lesson' : 'Mark as free preview'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeLesson(mod.id, lesson.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={s.addLessonBtn} onPress={() => addLesson(mod.id)}>
                <Ionicons name="add-outline" size={16} color={colors.primary} />
                <Text style={s.addLessonText}>Add Lesson</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={s.addModuleBtn} onPress={addModule}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={s.addModuleBtnText}>Add Module</Text>
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
              <Text style={sw.nextBtnText}>{busy ? 'Publishing…' : 'Publish Course'}</Text>
            </TouchableOpacity>
          </View>
        )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  moduleCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  moduleHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  moduleNumBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  moduleNum: { fontSize: 11, fontWeight: '800', color: '#fff' },
  lessonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  lessonDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 14 },
  lessonPickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonPickText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  freeToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freeToggleText: { fontSize: 11, color: colors.textSecondary },
  addLessonBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  addLessonText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  addModuleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.lg, backgroundColor: '#FFF8F5' },
  addModuleBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
