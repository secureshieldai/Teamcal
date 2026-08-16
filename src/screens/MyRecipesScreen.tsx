import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useMyRecipes, FILTER_TAGS, type MyRecipeRecord } from '../hooks/useMyRecipes';
import type { DietOption } from '../data/recipeTemplates';
import AIRecipeStudioModal from '../components/recipes/AIRecipeStudioModal';
import ImportUrlModal from '../components/recipes/ImportUrlModal';
import type { RootStackParamList } from '../navigation/types';

const CARD_GRADIENTS: [string, string][] = [
  ['#FF6A2B', '#FFB877'],
  ['#182241', '#3E4C77'],
  ['#276B54', '#3FA383'],
];

export default function MyRecipesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipes, loading, query, setQuery, filter, setFilter, generateFromPrompt, importFromUrl, remove, toRecipe, isEmpty } = useMyRecipes();
  const [studioOpen, setStudioOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, diet: DietOption) => {
    try {
      await generateFromPrompt(prompt, diet);
    } catch (e) {
      Alert.alert('Unable to generate recipe', (e as Error).message);
    }
  };

  const handleImport = async (url: string) => {
    try {
      await importFromUrl(url);
    } catch (e) {
      Alert.alert('Unable to import recipe', (e as Error).message);
    }
  };

  const confirmDelete = (record: MyRecipeRecord) => {
    Alert.alert('Delete this recipe?', `"${record.data.title}" will be removed from My Recipes.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(record.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>My Recipes</Text>
          <Text style={styles.subtitle}>Cooking mode & import</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#FDECE4', '#FFD9C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.studioHero}>
          <View style={styles.studioIcon}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View style={styles.studioTextWrap}>
            <Text style={styles.studioTitle}>AI Recipe Studio</Text>
            <Text style={styles.studioSubtitle}>Generate a recipe from anything in your pantry</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setStudioOpen(true)} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.tileRow}>
          <TouchableOpacity style={[styles.tile, shadow.soft]} onPress={() => setImportOpen(true)} activeOpacity={0.85}>
            <View style={[styles.tileIcon, { backgroundColor: '#FDECE4' }]}>
              <Ionicons name="link" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Import from URL</Text>
            <Text style={styles.tileSubtitle}>Blogs, IG, TikTok</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, shadow.soft]} onPress={() => setStudioOpen(true)} activeOpacity={0.85}>
            <View style={[styles.tileIcon, { backgroundColor: '#FDECE4' }]}>
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tileTitle}>AI create</Text>
            <Text style={styles.tileSubtitle}>From goals & pantry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your recipes"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTER_TAGS.map((tag) => {
            const active = filter === tag;
            return (
              <TouchableOpacity key={tag} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setFilter(tag)}>
                {tag === 'All' && <Ionicons name="folder" size={13} color={active ? colors.white : colors.textSecondary} style={{ marginRight: 4 }} />}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <Text style={styles.empty}>Loading your recipes…</Text>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySubtitle}>Import, generate, or write your first.</Text>
          </View>
        ) : recipes.length === 0 ? (
          <Text style={styles.empty}>No recipes match this filter.</Text>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {recipes.map((record, index) => {
              const { data } = record;
              const expanded = expandedId === record.id;
              const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              return (
                <View key={record.id} style={[styles.card, shadow.card]}>
                  <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardImage}>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{data.source === 'ai' ? 'AI' : data.source === 'url' ? 'URL' : 'Manual'}</Text>
                      </View>
                      {data.dietTag && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{data.dietTag}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{data.title}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(record)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('CookMode', { recipe: toRecipe(record) })} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="play" size={15} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.statText}>{data.timeMin}m</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.statText}>{data.servings}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="flame-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.statText}>{data.kcal} kcal</Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => setExpandedId(expanded ? null : record.id)} activeOpacity={0.7}>
                      <View style={styles.expandRow}>
                        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={13} color={colors.primary} />
                        <Text style={styles.expandText}>View ingredients & steps</Text>
                      </View>
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.expandedBody}>
                        {data.ingredients.length > 0 && (
                          <>
                            <Text style={styles.expandedLabel}>INGREDIENTS</Text>
                            {data.ingredients.map((ing, i) => (
                              <View key={i} style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.bulletText}>{ing}</Text>
                              </View>
                            ))}
                          </>
                        )}
                        <Text style={[styles.expandedLabel, { marginTop: spacing.md }]}>STEPS</Text>
                        {data.steps.map((step, i) => (
                          <View key={i} style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
                            <Text style={styles.bulletText}>{step.text}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AIRecipeStudioModal visible={studioOpen} onClose={() => setStudioOpen(false)} onGenerate={handleGenerate} />
      <ImportUrlModal visible={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.navy },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },

  studioHero: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  studioIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  studioTextWrap: { flex: 1 },
  studioTitle: { fontSize: 14.5, fontWeight: '800', color: colors.navy },
  studioSubtitle: { fontSize: 11.5, color: 'rgba(24,34,65,0.65)', marginTop: 2 },
  createBtn: { backgroundColor: colors.navy, borderRadius: radii.pill, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  tileRow: { flexDirection: 'row', gap: spacing.md },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  tileIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  tileTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  tileSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },

  chipRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  filterChipTextActive: { color: colors.white },

  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: { fontSize: 12.5, color: colors.textSecondary },

  card: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  cardImage: { height: 110, padding: spacing.md, justifyContent: 'flex-start' },
  badgeRow: { flexDirection: 'row', gap: spacing.xs },
  badge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: '800', color: colors.textPrimary },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { flex: 1, fontSize: 15.5, fontWeight: '800', color: colors.textPrimary },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  expandText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  expandedBody: { marginTop: spacing.sm, gap: 6 },
  expandedLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: 4 },
  stepNumber: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumberText: { fontSize: 10, fontWeight: '800', color: colors.white },
});
