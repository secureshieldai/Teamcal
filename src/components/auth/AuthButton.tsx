import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
};

export default function AuthButton({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[styles.base, isOutline ? styles.outline : styles.primary, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.navy : colors.white} />
      ) : (
        <Text style={[styles.text, isOutline ? styles.textOutline : styles.textPrimary]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.navy,
  },
});
