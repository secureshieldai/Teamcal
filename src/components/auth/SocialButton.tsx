import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GoogleIcon from '../icons/GoogleIcon';
import { colors, radii, spacing } from '../../theme';

type Props = {
  provider: 'google' | 'apple';
  onPress?: () => void;
  disabled?: boolean;
};

const LABELS = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
};

export default function SocialButton({ provider, onPress, disabled }: Props) {
  return (
    <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      {provider === 'google' ? (
        <GoogleIcon size={18} />
      ) : (
        <Ionicons name="logo-apple" size={18} color={colors.textPrimary} />
      )}
      <Text style={styles.label}>{LABELS[provider]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.55,
  },
});
