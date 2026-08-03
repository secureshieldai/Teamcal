import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../../theme';
import { contentSourceOptions, audienceEngineConnectedAccounts, topPerformingContent } from '../../../data/earnData';

type Props = {
  selectedKey: string;
  onSelect: (key: string) => void;
  onNext: () => void;
};

export default function SelectContentStep({ selectedKey, onSelect, onNext }: Props) {
  const preview = topPerformingContent[0];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What do you want to promote?</Text>

      <View style={styles.grid}>
        {contentSourceOptions.map((option) => {
          const active = option.key === selectedKey;
          return (
            <TouchableOpacity key={option.key} style={[styles.optionCard, active && styles.optionCardActive]} onPress={() => onSelect(option.key)}>
              <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={20} color={active ? colors.primary : colors.textSecondary} />
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedKey ? (
        <View style={[styles.previewCard, shadow.soft]}>
          <View style={styles.previewThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {preview.title}
            </Text>
            <Text style={styles.previewMeta}>{preview.type} · Published · {preview.date}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Connected Accounts</Text>
      <View style={[styles.accountsCard, shadow.soft]}>
        {audienceEngineConnectedAccounts.map((account) => (
          <View key={account.key} style={styles.accountItem}>
            <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
              <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.white} />
            </View>
            <Text style={styles.accountCount}>{account.accounts}</Text>
            <Text style={styles.accountLabel}>{account.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.primaryBtn, !selectedKey && styles.primaryBtnDisabled]} disabled={!selectedKey} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.sm,
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  optionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  optionLabelActive: { color: colors.primary },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  previewThumb: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.border },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  previewMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sectionTitle: { ...typography.h2, fontSize: 14, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  accountsCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  accountItem: { alignItems: 'center', gap: 4 },
  accountIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  accountCount: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  accountLabel: { fontSize: 9.5, color: colors.textSecondary, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  primaryBtnDisabled: { backgroundColor: colors.ringTrack },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
