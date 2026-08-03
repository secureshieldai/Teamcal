import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { DRINK_TYPES, type DrinkTypeId } from '../../data/waterData';

export default function DrinkTypeGrid({ onPressType }: { onPressType: (id: DrinkTypeId) => void }) {
  return (
    <View style={styles.grid}>
      {DRINK_TYPES.map((type) => (
        <TouchableOpacity key={type.id} style={styles.item} activeOpacity={0.8} onPress={() => onPressType(type.id)}>
          <View style={[styles.iconCircle, { backgroundColor: type.background }]}>
            <Ionicons name={type.icon} size={22} color={type.color} />
          </View>
          <Text style={styles.label} numberOfLines={1}>{type.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ITEM_WIDTH = '23%';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
