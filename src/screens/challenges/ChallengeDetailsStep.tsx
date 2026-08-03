import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { challengeTypes, durationPresets } from '../../data/challengesData';

type Props = {
  challengeType: string;
  setChallengeType: (v: string) => void;
  durationDays: number;
  setDurationDays: (v: number) => void;
  goalTarget: string;
  setGoalTarget: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function ChallengeDetailsStep({ challengeType, setChallengeType, durationDays, setDurationDays, goalTarget, setGoalTarget, onNext, onBack }: Props) {
  const [customDuration, setCustomDuration] = useState('');
  const [showCustom, setShowCustom] = useState(!durationPresets.includes(durationDays));
  const activeType = challengeTypes.find((t) => t.id === challengeType) ?? challengeTypes[0];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.fieldLabel}>Challenge Type</Text>
      <View style={styles.typeGrid}>
        {challengeTypes.map((type) => {
          const active = type.id === challengeType;
          return (
            <TouchableOpacity key={type.id} style={[styles.typeCard, active && { borderColor: type.color, backgroundColor: `${type.color}1A` }]} onPress={() => setChallengeType(type.id)}>
              <Ionicons name={type.icon} size={20} color={active ? type.color : colors.textSecondary} />
              <Text style={[styles.typeLabel, active && { color: type.color }]}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Duration</Text>
      <View style={styles.chipRow}>
        {durationPresets.map((d) => {
          const active = !showCustom && d === durationDays;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setShowCustom(false);
                setDurationDays(d);
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{d} Days</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={[styles.chip, showCustom && styles.chipActive]} onPress={() => setShowCustom(true)}>
          <Ionicons name="calendar-outline" size={13} color={showCustom ? colors.white : colors.textSecondary} />
          <Text style={[styles.chipText, showCustom && styles.chipTextActive]}> Custom</Text>
        </TouchableOpacity>
      </View>
      {showCustom && (
        <TextInput
          style={styles.input}
          value={customDuration}
          onChangeText={(v) => {
            setCustomDuration(v);
            const n = Number(v);
            if (n > 0) setDurationDays(n);
          }}
          placeholder="Number of days"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
      )}

      <Text style={styles.fieldLabel}>Goal Target</Text>
      <View style={styles.goalRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={goalTarget}
          onChangeText={setGoalTarget}
          placeholder="e.g. 10000"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        <Text style={styles.unitText}>{activeType.unit}</Text>
      </View>
      <Text style={styles.hint}>Set your total {activeType.label.toLowerCase()} goal for the challenge</Text>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: { width: '31%', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.md },
  typeLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginTop: spacing.sm },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
