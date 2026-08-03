import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';

type Props = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'lg' | 'sm';
  trend?: string;
  trendUp?: boolean;
};

export default function StatCard({ label, value, icon, size = 'sm', trend, trendUp = true }: Props) {
  return (
    <View style={[styles.card, size === 'lg' ? styles.cardLg : styles.cardSm, shadow.soft]}>
      <View style={styles.topRow}>
        {icon && (
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={15} color={colors.primary} />
          </View>
        )}
        {trend && (
          <Text style={[styles.trend, { color: trendUp ? colors.success : colors.macroProtein }]}>
            {trendUp ? '↑' : '↓'} {trend}
          </Text>
        )}
      </View>
      <Text style={[styles.value, size === 'lg' && styles.valueLg]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  cardSm: {
    width: '31.5%',
  },
  cardLg: {
    width: '48%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  valueLg: {
    fontSize: 20,
  },
  label: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});
