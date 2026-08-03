import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';

const STEPS = ['Select Content', 'Instructions', 'Customize', 'Generate', 'Review', 'Schedule'];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.row}>
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View style={[styles.circle, done && styles.circleDone, active && styles.circleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                ) : (
                  <Text style={[styles.circleText, active && styles.circleTextActive]}>{stepNumber}</Text>
                )}
              </View>
            </View>
            {stepNumber < STEPS.length && <View style={[styles.line, done && styles.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.success,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  circleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  circleTextActive: {
    color: colors.white,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
});
