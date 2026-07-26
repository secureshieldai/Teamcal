import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type Item = { id: string; icon: keyof typeof Ionicons.glyphMap; label: string };

type Props = {
  items: Item[];
  onPressItem?: (id: string) => void;
};

export default function QuickAccessGrid({ items, onPressItem }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          onPress={() => onPressItem?.(item.id)}
          activeOpacity={0.75}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '20%',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: '#F2F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 13,
  },
});
