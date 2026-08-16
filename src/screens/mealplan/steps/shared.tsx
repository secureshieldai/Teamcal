import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function WizardStepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headerWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function OptionCard({
  label,
  sublabel,
  selected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.optionCard, selected && styles.optionCardActive]} onPress={onPress} activeOpacity={0.85}>
      <View>
        <Text style={styles.optionLabel}>{label}</Text>
        {sublabel ? <Text style={styles.optionSublabel}>{sublabel}</Text> : null}
      </View>
      <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
        {selected ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export function IconOptionRow({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: IconName;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.iconRow, selected && styles.iconRowActive]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconRowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.iconRowLabel}>{label}</Text>
      <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
        {selected ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export function Chip({ label, selected, solid, onPress }: { label: string; selected: boolean; solid?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && (solid ? styles.chipSolid : styles.chipOutline)]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && (solid ? styles.chipTextSolid : styles.chipTextOutline)]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

export function WizardFooter({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextIcon,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextIcon?: IconName;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.footerRow}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[styles.primaryBtn, !onBack && { flex: undefined, width: '100%' }, nextDisabled && styles.primaryBtnDisabled]}
        onPress={onNext}
        activeOpacity={0.85}
        disabled={nextDisabled}
      >
        {nextIcon ? <Ionicons name={nextIcon} size={16} color={colors.white} /> : null}
        <Text style={styles.primaryBtnText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionSublabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  iconRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  iconRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
  },
  chipOutline: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  chipSolid: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipTextOutline: {
    color: colors.primary,
  },
  chipTextSolid: {
    color: colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
