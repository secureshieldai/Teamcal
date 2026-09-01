import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ARTICLE_CATEGORIES } from '../data/articleCategories';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectCategory'>;

export default function SelectCategoryScreen({ navigation, route }: Props) {
  const { blogId, articleId, current } = route.params;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(current);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ARTICLE_CATEGORIES;
    return ARTICLE_CATEGORIES.filter((c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [query]);

  const apply = () => {
    if (!selected) return;
    navigation.navigate('ArticleEditor', { blogId, articleId, pickedCategory: selected });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Select Category</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = selected === item.id;
          return (
            <TouchableOpacity style={[styles.card, shadow.soft, active && styles.cardActive]} activeOpacity={0.85} onPress={() => setSelected(item.id)}>
              <View style={[styles.icon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.applyBtn, !selected && styles.applyBtnDisabled]} disabled={!selected} onPress={apply} activeOpacity={0.88}>
          <Text style={styles.applyText}>Apply Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  cardActive: { borderColor: colors.primary },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  cardDescription: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2, lineHeight: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  applyBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  applyBtnDisabled: { opacity: 0.5 },
  applyText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
