import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

type Category = { id: string; icon: keyof typeof Ionicons.glyphMap; label: string };

type Props = {
  categories: Category[];
  onPressCategory?: (id: string) => void;
};

export default function CategoriesGrid({ categories, onPressCategory }: Props) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.item}
          onPress={() => onPressCategory?.(category.id)}
          activeOpacity={0.75}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={category.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {category.label}
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
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});
