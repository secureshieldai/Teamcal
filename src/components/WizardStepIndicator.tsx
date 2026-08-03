import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  currentStep: number;
  totalSteps: number;
};

export default function WizardStepIndicator({ currentStep, totalSteps }: Props) {
  const percent = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  track: {
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
