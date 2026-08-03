import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';

type Props = {
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  allowInvites: boolean;
  setAllowInvites: (v: boolean) => void;
  maxParticipants: string;
  setMaxParticipants: (v: string) => void;
  durationDays: number;
  rules: string;
  setRules: (v: string) => void;
  onCreate: () => void;
  onBack: () => void;
  creating: boolean;
};

export default function ChallengeSettingsStep({
  isPublic,
  setIsPublic,
  allowInvites,
  setAllowInvites,
  maxParticipants,
  setMaxParticipants,
  durationDays,
  rules,
  setRules,
  onCreate,
  onBack,
  creating,
}: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + durationDays * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.fieldLabel}>Privacy</Text>
      <View style={styles.privacyRow}>
        <TouchableOpacity style={[styles.privacyCard, isPublic && styles.privacyCardActive]} onPress={() => setIsPublic(true)}>
          <Ionicons name="globe-outline" size={20} color={isPublic ? colors.primary : colors.textSecondary} />
          <Text style={[styles.privacyLabel, isPublic && { color: colors.primary }]}>Public</Text>
          <Text style={styles.privacyHint}>Anyone can join</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.privacyCard, !isPublic && styles.privacyCardActive]} onPress={() => setIsPublic(false)}>
          <Ionicons name="lock-closed-outline" size={20} color={!isPublic ? colors.primary : colors.textSecondary} />
          <Text style={[styles.privacyLabel, !isPublic && { color: colors.primary }]}>Private</Text>
          <Text style={styles.privacyHint}>Invite only</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Allow friends to invite others</Text>
          <Switch value={allowInvites} onValueChange={setAllowInvites} trackColor={{ true: colors.primary }} />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowLabel}>Max participants (optional)</Text>
          <TextInput
            style={styles.inlineInput}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="No limit"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowLabel}>Challenge starts on</Text>
          <Text style={styles.rowValue}>{fmt(startsAt)}</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowLabel}>Set end date</Text>
          <Text style={styles.rowValue}>{fmt(endsAt)}</Text>
        </View>
        <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => setRulesOpen((v) => !v)}>
          <Text style={styles.rowLabel}>Add Rules (optional)</Text>
          <Ionicons name={rulesOpen ? 'chevron-up' : 'chevron-forward'} size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {rulesOpen && (
          <TextInput
            style={styles.rulesInput}
            value={rules}
            onChangeText={setRules}
            placeholder="e.g. Log your progress daily, no cheating..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        )}
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onCreate} disabled={creating} activeOpacity={0.85}>
          <Ionicons name="trophy-outline" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>{creating ? 'Creating…' : 'Create Challenge'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  privacyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  privacyCard: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.lg },
  privacyCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  privacyLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  privacyHint: { fontSize: 10.5, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, gap: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', flexShrink: 1 },
  rowValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  inlineInput: { fontSize: 13, color: colors.textPrimary, fontWeight: '700', textAlign: 'right', minWidth: 70 },
  rulesInput: { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary, minHeight: 70, textAlignVertical: 'top', marginBottom: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
