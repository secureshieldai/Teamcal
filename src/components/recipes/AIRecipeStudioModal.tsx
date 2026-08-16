import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { DIET_OPTIONS, type DietOption } from '../../data/recipeTemplates';

type Props = {
  visible: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, diet: DietOption) => Promise<void>;
};

export default function AIRecipeStudioModal({ visible, onClose, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [diet, setDiet] = useState<DietOption>(DIET_OPTIONS[0]);
  const [generating, setGenerating] = useState(false);

  const close = () => {
    if (generating) return;
    setPrompt('');
    setDiet(DIET_OPTIONS[0]);
    onClose();
  };

  const submit = async () => {
    setGenerating(true);
    try {
      await onGenerate(prompt, diet);
      close();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.headerTitle}>AI Recipe Studio</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textarea}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="e.g. Quick post-workout meal with chicken, rice, and something spicy"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.dietLabel}>DIET</Text>
          <View style={styles.dietRow}>
            {DIET_OPTIONS.map((option) => {
              const active = diet === option;
              return (
                <TouchableOpacity key={option} style={[styles.dietChip, active && styles.dietChipActive]} onPress={() => setDiet(option)}>
                  <Text style={[styles.dietChipText, active && styles.dietChipTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={submit} disabled={generating} activeOpacity={0.88}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.generateBtn}>
              {generating ? <ActivityIndicator color={colors.white} /> : <Text style={styles.generateText}>Generate recipe</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  textarea: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, minHeight: 76, fontSize: 13.5, color: colors.textPrimary, textAlignVertical: 'top' },
  dietLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6, marginTop: -spacing.sm },
  dietRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dietChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dietChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dietChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  dietChipTextActive: { color: colors.white },
  generateBtn: { borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center' },
  generateText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
