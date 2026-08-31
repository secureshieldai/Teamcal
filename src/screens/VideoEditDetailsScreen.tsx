import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { CategoryDropdown, LanguageDropdown, Field, sw } from './earn/video/VideoWizardShared';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoEditDetails'>;

export default function VideoEditDetailsScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('English');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setTitle(a.title);
      setDescription(a.description || '');
      const md = (a.metadata || {}) as VideoMetadata;
      setCategory(md.category || '');
      setLanguage(md.language || 'English');
      setTags(md.tags || []);
    }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) { setTagInput(''); return; }
    setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert('Title required');
    if (!category) return Alert.alert('Category required');
    setSaving(true);
    try {
      const current = await earnService.getAsset(videoId);
      await earnService.updateAsset(videoId, {
        title: title.trim(),
        description: description.trim(),
        metadata: { ...current.metadata, category, language, tags },
      });
      Alert.alert('Saved', 'Your video details have been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Details</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
        <Field label="Video Title" value={title} onChangeText={setTitle} maxLength={120} required />
        <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000} placeholder="Describe what viewers will get" />
        <CategoryDropdown value={category} onChange={setCategory} />
        <LanguageDropdown value={language} onChange={setLanguage} />

        <Text style={sw.fieldLabel}>Tags</Text>
        <View style={s.tagInputRow}>
          <TextInput
            style={[sw.input, { flex: 1 }]}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Type a tag and press add"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addTagBtn} onPress={addTag}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.tagsWrap}>
          {tags.map(t => (
            <View key={t} style={s.tagChip}>
              <Text style={s.tagChipText}>{t}</Text>
              <TouchableOpacity onPress={() => setTags(prev => prev.filter(x => x !== t))}>
                <Ionicons name="close" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          {!tags.length && <Text style={s.tagsHint}>Add tags to help viewers discover this video.</Text>}
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  tagInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addTagBtn: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.md },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0E8', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  tagChipText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  tagsHint: { fontSize: 11, color: colors.textMuted },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
