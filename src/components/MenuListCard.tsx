import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';

export type MenuItem = { id: string; icon: keyof typeof Ionicons.glyphMap; label: string };

type Props = {
  items: MenuItem[];
  onPressItem?: (id: string) => void;
};

export default function MenuListCard({ items, onPressItem }: Props) {
  return (
    <View style={[styles.card, shadow.card]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}
          onPress={() => onPressItem?.(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={17} color={colors.primary} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
