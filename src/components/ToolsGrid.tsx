import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';

type Item = { id: string; icon: keyof typeof Ionicons.glyphMap; label: string; description: string };

type Props = {
  items: Item[];
  onPressItem?: (id: string) => void;
};

const TINTS = [
  { bg: '#E6F9EF', fg: colors.success },
  { bg: '#E5F0FF', fg: colors.macroFat },
  { bg: '#FFEDE3', fg: colors.primary },
  { bg: '#EFEAFE', fg: '#8B5CF6' },
  { bg: '#FDE7E9', fg: colors.macroProtein },
  { bg: '#E0F7F5', fg: '#14B8A6' },
];

export default function ToolsGrid({ items, onPressItem }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => {
        const tint = TINTS[index % TINTS.length];
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, shadow.soft]}
            onPress={() => onPressItem?.(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: tint.bg }]}>
              <Ionicons name={item.icon} size={26} color={tint.fg} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '31.5%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  description: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
});
