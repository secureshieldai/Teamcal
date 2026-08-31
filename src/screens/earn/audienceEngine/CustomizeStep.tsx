import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../../theme';
import { audienceEngineFormats, audienceEngineObjectives } from '../../../data/earnData';

import { TextInput } from 'react-native';

const POST_PRESETS = [10, 20, 40, 50, 100];

type Props = {
  postsCount: number;
  setPostsCount: (n: number) => void;
  customPostCount: number;
  setCustomPostCount: (n: number) => void;
  formats: string[];
  toggleFormat: (key: string) => void;
  objective: string;
  setObjective: (key: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function CustomizeStep({ postsCount, setPostsCount, customPostCount, setCustomPostCount, formats, toggleFormat, objective, setObjective, onNext, onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Customize Your Campaign</Text>
      <Text style={styles.subtitle}>Choose how your posts will be created and who they are for.</Text>

      <Text style={styles.fieldLabel}>1. How many posts do you want to generate?</Text>
      <View style={styles.chipWrap}>
        {POST_PRESETS.map((n) => (
          <TouchableOpacity key={n} style={[styles.chip, postsCount === n && !customPostCount && styles.chipActive]} onPress={() => { setPostsCount(n); setCustomPostCount(0); }}>
            <Text style={[styles.chipText, postsCount === n && !customPostCount && styles.chipTextActive]}>{n} Posts</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customPostWrap}>
        <Text style={styles.customPostLabel}>Custom number:</Text>
        <View style={styles.customPostInput}>
          <TextInput
            placeholder="Enter number"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={customPostCount > 0 ? String(customPostCount) : ''}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n > 0) {
                setCustomPostCount(n);
                setPostsCount(n);
              } else {
                setCustomPostCount(0);
              }
            }}
            style={styles.customPostInputText}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>2. Content Formats (Select one or more)</Text>
      <View style={styles.formatGrid}>
        {audienceEngineFormats.map((format) => {
          const active = formats.includes(format.key);
          return (
            <TouchableOpacity key={format.key} style={[styles.formatCard, active && styles.formatCardActive]} onPress={() => toggleFormat(format.key)}>
              <View style={styles.formatTopRow}>
                <View style={[styles.checkbox, active && styles.checkboxActive]}>{active && <Ionicons name="checkmark" size={11} color={colors.white} />}</View>
                <Text style={styles.formatLabel}>{format.label}</Text>
              </View>
              <Text style={styles.formatCount}>{format.count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>3. Objective (What do you want to achieve?)</Text>
      <View style={styles.chipWrap}>
        {audienceEngineObjectives.map((o) => {
          const active = o.key === objective;
          return (
            <TouchableOpacity key={o.key} style={[styles.objectiveCard, active && styles.objectiveCardActive]} onPress={() => setObjective(o.key)}>
              <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={16} color={active ? colors.primary : colors.textSecondary} />
              <Text style={[styles.objectiveLabel, active && styles.objectiveLabelActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={colors.macroFat} />
        <Text style={styles.infoBannerText}>Estimated posts per platform will be distributed based on your selections.</Text>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onNext} activeOpacity={0.85} disabled={formats.length === 0}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 17 },
  fieldLabel: { ...typography.h2, fontSize: 13, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  customPostWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  customPostLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  customPostInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.sm, height: 36, backgroundColor: colors.background },
  customPostInputText: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formatCard: { width: '48%', backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md },
  formatCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  formatTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formatLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  formatCount: { fontSize: 11, color: colors.textSecondary, marginTop: 6, marginLeft: 26 },
  objectiveCard: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  objectiveCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  objectiveLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  objectiveLabelActive: { color: colors.primary },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#E5F0FF', borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.lg },
  infoBannerText: { flex: 1, fontSize: 11.5, color: colors.macroFat, lineHeight: 16 },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
