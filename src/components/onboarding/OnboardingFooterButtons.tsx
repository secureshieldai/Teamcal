import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

type NextBackProps = {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export function BackNextButtons({ onBack, onNext, nextLabel = 'Next' }: NextBackProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.nextText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

type PrimaryCtaProps = {
  label: string;
  onPress: () => void;
  caption?: string;
  onPressCaption?: () => void;
};

export function PrimaryCta({ label, onPress, caption, onPressCaption }: PrimaryCtaProps) {
  return (
    <View>
      <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.primaryText}>{label}</Text>
      </TouchableOpacity>
      {caption ? (
        <TouchableOpacity onPress={onPressCaption} disabled={!onPressCaption} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.caption}>{caption}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  caption: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
