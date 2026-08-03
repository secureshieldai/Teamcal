import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';
import { audienceEngineConnectedAccounts } from '../../../data/earnData';

type SchedulingOption = 'smart' | 'custom' | 'queue';

const SCHEDULING_OPTIONS: { key: SchedulingOption; label: string; description: string; icon: string }[] = [
  { key: 'smart', label: 'Smart Schedule', description: 'AI picks the best times to maximize reach and engagement.', icon: 'sparkles-outline' },
  { key: 'custom', label: 'Custom Dates & Times', description: 'Choose specific dates and times for each post manually.', icon: 'calendar-outline' },
  { key: 'queue', label: 'Queue Mode', description: "Add posts to a queue and we'll publish in order at the best times.", icon: 'time-outline' },
];

type Props = {
  selectedAccounts: string[];
  toggleAccount: (key: string) => void;
  schedulingOption: SchedulingOption;
  setSchedulingOption: (v: SchedulingOption) => void;
  onSchedule: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
};

export default function ScheduleStep({ selectedAccounts, toggleAccount, schedulingOption, setSchedulingOption, onSchedule, onSaveDraft, onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Schedule Your Posts</Text>
      <Text style={styles.subtitle}>Choose where and when your content will be published.</Text>

      <Text style={styles.fieldLabel}>A. Select Platforms & Accounts</Text>
      <View style={[styles.card, shadow.soft]}>
        {audienceEngineConnectedAccounts.map((account, i) => {
          const active = selectedAccounts.includes(account.key);
          return (
            <TouchableOpacity
              key={account.key}
              style={[styles.accountRow, i === audienceEngineConnectedAccounts.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => toggleAccount(account.key)}
            >
              <View style={[styles.checkbox, active && styles.checkboxActive]}>{active && <Ionicons name="checkmark" size={12} color={colors.white} />}</View>
              <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={14} color={colors.white} />
              </View>
              <Text style={styles.accountLabel}>{account.label}</Text>
              <Text style={styles.accountCount}>{account.accounts} accounts</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>B. Scheduling Options</Text>
      <View style={{ gap: spacing.sm }}>
        {SCHEDULING_OPTIONS.map((option) => {
          const active = option.key === schedulingOption;
          return (
            <TouchableOpacity key={option.key} style={[styles.schedulingCard, active && styles.schedulingCardActive]} onPress={() => setSchedulingOption(option.key)}>
              <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={20} color={active ? colors.primary : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.schedulingLabel, active && { color: colors.primary }]}>{option.label}</Text>
                <Text style={styles.schedulingDescription}>{option.description}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryBanner}>
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <Text style={styles.summaryText}>
          {selectedAccounts.length} platform{selectedAccounts.length === 1 ? '' : 's'} selected · Posts will publish using {SCHEDULING_OPTIONS.find((o) => o.key === schedulingOption)?.label}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={onSaveDraft}>
          <Text style={styles.outlineBtnText}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.primaryBtn, selectedAccounts.length === 0 && styles.primaryBtnDisabled]} onPress={onSchedule} activeOpacity={0.85} disabled={selectedAccounts.length === 0}>
        <Ionicons name="calendar-outline" size={16} color={colors.white} />
        <Text style={styles.primaryBtnText}>Schedule Posts</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 17 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.lg },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  accountIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accountLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  accountCount: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  schedulingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md },
  schedulingCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  schedulingLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  schedulingDescription: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2, lineHeight: 14 },
  summaryBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#E6F9EF', borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.lg },
  summaryText: { flex: 1, fontSize: 11, color: colors.success, fontWeight: '600', lineHeight: 15 },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  primaryBtn: { flexDirection: 'row', gap: 6, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryBtnDisabled: { backgroundColor: colors.ringTrack },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
