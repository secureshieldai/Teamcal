import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type PdfMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { CategoryDropdown, Field, ps } from './earn/pdf/PdfWizardShared';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfEditDetails'>;

export default function PdfEditDetailsScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    earnService.getAsset(pdfId).then(a => {
      setTitle(a.title);
      setDescription(a.description || '');
      const md = (a.metadata || {}) as PdfMetadata;
      setCategory(md.category || '');
      setTags(md.tags || []);
    }).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

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
      const current = await earnService.getAsset(pdfId);
      await earnService.updateAsset(pdfId, {
        title: title.trim(),
        description: description.trim(),
        metadata: { ...current.metadata, category, tags },
      });
      Alert.alert('Saved', 'Your PDF details have been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
      <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
        <Field label="PDF title" value={title} onChangeText={setTitle} maxLength={120} required />
        <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} placeholder="Describe what buyers will get" />
        <CategoryDropdown value={category} onChange={setCategory} />

        <Text style={ps.fieldLabel}>Tags</Text>
        <View style={s.tagInputRow}>
          <TextInput
            style={[ps.input, { flex: 1 }]}
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
          {!tags.length && <Text style={s.tagsHint}>Add up to 30 tags to help buyers discover this PDF.</Text>}
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
