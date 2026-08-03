import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../../theme';
import { audienceEngineTones } from '../../../data/earnData';

const KEY_POINTS = ['Benefits of the content', 'Key lessons', 'Common mistakes', 'Success stories', 'Before & after results'];
const QUICK_INPUTS = [
  { key: 'mic', label: 'Mic', icon: 'mic-outline' },
  { key: 'images', label: 'Upload Images', icon: 'image-outline' },
  { key: 'docs', label: 'Upload Docs', icon: 'document-outline' },
  { key: 'ai', label: 'AI Assist', icon: 'sparkles-outline' },
] as const;

type Props = {
  instructions: string;
  setInstructions: (v: string) => void;
  keyPoints: string[];
  toggleKeyPoint: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  avoid: string;
  setAvoid: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function InstructionsStep({ instructions, setInstructions, keyPoints, toggleKeyPoint, tone, setTone, avoid, setAvoid, notes, setNotes, onNext, onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What kind of content would you like to create?</Text>
      <Text style={styles.subtitle}>Give the AI clear guidance so it can create engaging posts that attract attention.</Text>

      <Text style={styles.fieldLabel}>1. Your Instructions</Text>
      <TextInput
        style={styles.textArea}
        multiline
        value={instructions}
        onChangeText={(v) => setInstructions(v.slice(0, 2000))}
        placeholder="Example: Create 50 attention-grabbing posts from this article. Focus on the surprising lessons and practical takeaways. Do not reveal the full answer. Encourage people to read more."
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.charCount}>{instructions.length}/2000 characters</Text>

      <View style={styles.quickInputRow}>
        {QUICK_INPUTS.map((input) => (
          <TouchableOpacity key={input.key} style={styles.quickInputBtn} onPress={() => Alert.alert('Coming soon', `${input.label} isn't available yet.`)}>
            <Ionicons name={input.icon as keyof typeof Ionicons.glyphMap} size={14} color={colors.textPrimary} />
            <Text style={styles.quickInputText}>{input.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>2. Key Points to Focus On (Optional)</Text>
      <View style={styles.chipWrap}>
        {KEY_POINTS.map((point) => {
          const active = keyPoints.includes(point);
          return (
            <TouchableOpacity key={point} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleKeyPoint(point)}>
              {active && <Ionicons name="checkmark" size={12} color={colors.white} style={{ marginRight: 4 }} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{point}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>3. Tone & Style</Text>
      <View style={styles.toneRow}>
        {audienceEngineTones.map((t) => {
          const active = t.key === tone;
          return (
            <TouchableOpacity key={t.key} style={[styles.toneCard, active && styles.toneCardActive]} onPress={() => setTone(t.key)}>
              <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={18} color={active ? colors.primary : colors.textSecondary} />
              <Text style={[styles.toneLabel, active && styles.toneLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>4. What to Avoid (Optional)</Text>
      <TextInput
        style={[styles.textArea, { minHeight: 60 }]}
        multiline
        value={avoid}
        onChangeText={(v) => setAvoid(v.slice(0, 500))}
        placeholder="e.g. Avoid very salesy language, don't reveal full answers..."
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>5. Additional Notes (Optional)</Text>
      <TextInput
        style={[styles.textArea, { minHeight: 60 }]}
        multiline
        value={notes}
        onChangeText={(v) => setNotes(v.slice(0, 500))}
        placeholder="Any extra details, brand voice, examples, or references..."
        placeholderTextColor={colors.textMuted}
      />

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onNext} activeOpacity={0.85}>
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
  textArea: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, fontSize: 13, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  quickInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  quickInputBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  quickInputText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toneCard: { width: '31%', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.md },
  toneCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  toneLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  toneLabelActive: { color: colors.primary },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
