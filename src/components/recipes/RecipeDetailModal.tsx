import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { Recipe } from '../../services/api/recipe.service';

type Props = {
  recipe: Recipe | null;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
  onStartCookMode: (recipe: Recipe) => void;
};

export default function RecipeDetailModal({ recipe, saved, onToggleSaved, onClose, onStartCookMode }: Props) {
  return (
    <Modal visible={!!recipe} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {recipe && (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View>
                <Image source={{ uri: recipe.image }} style={styles.image} />
                <TouchableOpacity style={[styles.overlayBtn, styles.overlayLeft]} onPress={onToggleSaved}>
                  <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.overlayBtn, styles.overlayRight]} onPress={onClose}>
                  <Ionicons name="close" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <View style={styles.bylineRow}>
                  <Text style={styles.byline}>Blaze</Text>
                  <Text style={styles.bylineDot}>·</Text>
                  <Ionicons name="star" size={12} color="#FFC542" />
                  <Text style={styles.byline}>{recipe.rating}</Text>
                </View>
                <Text style={styles.title}>{recipe.title}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{recipe.timeMin}m</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flame-outline" size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{recipe.kcal} kcal</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{recipe.proteinG}g P</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{recipe.servings} serv</Text>
                  </View>
                </View>

                <View style={styles.tagRow}>
                  {[recipe.category, ...recipe.dietTags].filter(Boolean).map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Ingredients</Text>
                {recipe.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.ingredientText}>{ing.text}</Text>
                  </View>
                ))}

                <Text style={styles.sectionTitle}>Steps</Text>
                {recipe.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.cookBtn} onPress={() => onStartCookMode(recipe)} activeOpacity={0.85}>
                  <Ionicons name="restaurant" size={17} color={colors.white} />
                  <Text style={styles.cookBtnText}>Start cook mode</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, maxHeight: '92%', overflow: 'hidden' },
  image: { width: '100%', height: 240, backgroundColor: colors.border },
  overlayBtn: { position: 'absolute', top: spacing.lg, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  overlayLeft: { left: spacing.lg },
  overlayRight: { right: spacing.lg },
  body: { padding: spacing.lg, gap: spacing.sm },
  bylineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  byline: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  bylineDot: { fontSize: 12.5, color: colors.textMuted },
  title: { fontSize: 21, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: { backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
  ingredientText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12.5, fontWeight: '800', color: colors.white },
  stepText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  cookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginTop: spacing.md, marginBottom: spacing.xl },
  cookBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
