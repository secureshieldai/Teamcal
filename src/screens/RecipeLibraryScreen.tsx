import React, { useRef, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useRecipeLibrary, CATEGORIES, type CategoryFilter } from '../hooks/useRecipeLibrary';
import type { Recipe } from '../services/api/recipe.service';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import type { RootStackParamList } from '../navigation/types';

const TIME_FILTERS = [
  { label: '≤15m', value: 15 },
  { label: '≤30m', value: 30 },
  { label: '≤60m', value: 60 },
];

export default function RecipeLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { query, setQuery, category, setCategory, maxTime, setMaxTime, recipes, trending, loading, error, savedIds, toggleSaved } =
    useRecipeLibrary();
  const [selected, setSelected] = useState<Recipe | null>(null);
  const trendingScrollRef = useRef<ScrollView>(null);
  const [trendingOffset, setTrendingOffset] = useState(0);

  const scrollTrending = (dir: 1 | -1) => {
    const next = Math.max(0, trendingOffset + dir * 240);
    trendingScrollRef.current?.scrollTo({ x: next, animated: true });
    setTrendingOffset(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Recipe Library</Text>
          <Text style={styles.subtitle}>Curated recipes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity key={c} style={[styles.categoryChip, active && styles.categoryChipActive]} onPress={() => setCategory(c as CategoryFilter)}>
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.chipRow}>
          {TIME_FILTERS.map((t) => {
            const active = maxTime === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.timeChip, active && styles.timeChipActive]}
                onPress={() => setMaxTime(active ? null : t.value)}
              >
                <Ionicons name="time-outline" size={12} color={active ? colors.white : colors.textSecondary} />
                <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {trending.length > 0 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={styles.sectionLabel}>TRENDING THIS WEEK</Text>
            </View>
            <ScrollView
              ref={trendingScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md }}
              onScroll={(e) => setTrendingOffset(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
            >
              {trending.map((r) => (
                <TouchableOpacity key={r.id} style={styles.trendingCard} onPress={() => setSelected(r)} activeOpacity={0.85}>
                  <View>
                    <Image source={{ uri: r.image }} style={styles.trendingImage} />
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#FFC542" />
                      <Text style={styles.ratingText}>{r.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.trendingMeta}>
                      {r.timeMin}m · {r.kcal} kcal
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.carouselNavRow}>
              <TouchableOpacity onPress={() => scrollTrending(-1)} style={styles.carouselArrow}>
                <Ionicons name="chevron-back" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.carouselTrack}>
                <View style={styles.carouselFill} />
              </View>
              <TouchableOpacity onPress={() => scrollTrending(1)} style={styles.carouselArrow}>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>{loading ? 'LOADING…' : `${recipes.length} RECIPES`}</Text>
        {error ? (
          <Text style={styles.empty}>Unable to load recipes: {error}</Text>
        ) : !loading && recipes.length === 0 ? (
          <Text style={styles.empty}>No recipes match these filters.</Text>
        ) : (
          <View style={styles.grid}>
            {recipes.map((r) => {
              const saved = savedIds.has(r.id);
              return (
                <TouchableOpacity key={r.id} style={[styles.gridCard, shadow.soft]} onPress={() => setSelected(r)} activeOpacity={0.85}>
                  <View>
                    <Image source={{ uri: r.image }} style={styles.gridImage} />
                    <TouchableOpacity style={styles.bookmarkBtn} onPress={() => toggleSaved(r)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={15} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <Text style={styles.gridMeta}>
                      {r.timeMin}m · {r.kcal} kcal · {r.proteinG}g P
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <RecipeDetailModal
        recipe={selected}
        saved={selected ? savedIds.has(selected.id) : false}
        onToggleSaved={() => selected && toggleSaved(selected)}
        onClose={() => setSelected(null)}
        onStartCookMode={(recipe) => {
          setSelected(null);
          navigation.navigate('CookMode', { recipe });
        }}
      />
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  categoryChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  categoryChipTextActive: { color: colors.white },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.card },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  timeChipTextActive: { color: colors.white },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  trendingCard: { width: 170, backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  trendingImage: { width: '100%', height: 110, backgroundColor: colors.border },
  ratingBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 3 },
  ratingText: { fontSize: 10.5, fontWeight: '700', color: colors.white },
  trendingInfo: { padding: spacing.md },
  trendingTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  trendingMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  carouselNavRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  carouselArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  carouselTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  carouselFill: { width: '55%', height: 4, backgroundColor: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCard: { width: '47%', backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  gridImage: { width: '100%', height: 110, backgroundColor: colors.border },
  bookmarkBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  gridInfo: { padding: spacing.md },
  gridTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, minHeight: 32 },
  gridMeta: { fontSize: 10.5, color: colors.textSecondary, marginTop: 4 },
});
