import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'pill' | 'underline';
};

export default function SegmentedControl({ options, value, onChange, variant = 'pill' }: Props) {
  if (variant === 'underline') {
    return (
      <View style={styles.underlineRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <TouchableOpacity key={option} onPress={() => onChange(option)} style={styles.underlineItem}>
              <Text style={[styles.underlineText, active && styles.underlineTextActive]}>{option}</Text>
              {active && <View style={styles.underlineBar} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  underlineRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  underlineItem: {
    paddingBottom: spacing.sm,
  },
  underlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  underlineTextActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  underlineBar: {
    marginTop: 6,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  pillRow: {
    gap: spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
});
