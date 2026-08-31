import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  goal: string;
  onPress?: () => void;
};

export default function StatTile({ icon, label, value, goal, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.tile, shadow.soft]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.goal}>{goal}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goal: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
});
