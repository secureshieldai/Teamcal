import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MiniProgressRing from './MiniProgressRing';
import { colors, radii, shadow, spacing } from '../theme';

type Props = {
  label: string;
  value: string;
  sub: string;
  percent?: number;
};

export default function WeekStatCard({ label, value, sub, percent }: Props) {
  return (
    <View style={[styles.card, shadow.soft]}>
      {typeof percent === 'number' ? (
        <MiniProgressRing size={64} strokeWidth={6} percent={percent}>
          <Text style={styles.ringValue}>{value}</Text>
        </MiniProgressRing>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
      <Text style={styles.sub}>{sub}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ringValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
});
