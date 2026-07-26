import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressRing from './ProgressRing';
import SectionHeader from './SectionHeader';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Macro = {
  key: string;
  label: string;
  value: number;
  goal: number;
  color: 'macroProtein' | 'macroCarbs' | 'macroFat';
};

type Props = {
  calories: number;
  calorieGoal: number;
  percent: number;
  macros: Macro[];
  onViewDetails?: () => void;
};

export default function TodayProgressCard({ calories, calorieGoal, percent, macros, onViewDetails }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Today's Progress" actionLabel="View Details" onPressAction={onViewDetails} />

      <View style={[styles.card, shadow.card]}>
        <ProgressRing percent={percent} value={calories} goal={calorieGoal} />

        <View style={styles.macros}>
          {macros.map((macro) => (
            <View key={macro.key} style={styles.macroRow}>
              <View style={[styles.dot, { backgroundColor: colors[macro.color] }]} />
              <View>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>
                  {macro.value} / {macro.goal}g
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macros: {
    gap: spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  macroValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 1,
  },
});
