import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MAX_ARTICLE_TAGS, POPULAR_ARTICLE_TAGS } from '../data/articleTags';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTags'>;

export default function AddTagsScreen({ navigation, route }: Props) {
  const { blogId, articleId, current } = route.params;
  const [tags, setTags] = useState<string[]>(current ?? []);
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.length >= MAX_ARTICLE_TAGS || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag]);
    setDraft('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const done = () => {
    navigation.navigate('ArticleEditor', { blogId, articleId, pickedTags: tags });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Tags</Text>
        <TouchableOpacity onPress={done}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a tag and press enter..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => addTag(draft)}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addTag(draft)} disabled={!draft.trim()}>
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Add 1 to 30 tags to help more people discover your article.</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selected Tags ({tags.length}/{MAX_ARTICLE_TAGS})</Text>
          {tags.length > 0 && (
            <TouchableOpacity onPress={() => setTags([])}>
              <Text style={styles.clearAll}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
        {tags.length ? (
          <View style={styles.chipRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No tags selected yet.</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Popular Tags</Text>
        <View style={styles.chipRow}>
          {POPULAR_ARTICLE_TAGS.map((tag) => {
            const active = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <TouchableOpacity key={tag} style={[styles.popularChip, active && styles.popularChipActive]} onPress={() => (active ? removeTag(tag) : addTag(tag))}>
                <Text style={[styles.popularChipText, active && styles.popularChipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  doneText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingLeft: spacing.lg, paddingRight: spacing.xs, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: spacing.md },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  clearAll: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEDE3', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selectedChipText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  popularChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  popularChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  popularChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  popularChipTextActive: { color: colors.white },
  empty: { fontSize: 12.5, color: colors.textMuted },
});
