import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';

type Item = { id: string; icon: keyof typeof Ionicons.glyphMap; label: string };

type Props = {
  items: Item[];
  onPressItem?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function QuickLogRow({ items, onPressItem, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          onPress={() => onPressItem?.(item.id)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconCircle, shadow.soft]}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    width: 60,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 13,
  },
});
