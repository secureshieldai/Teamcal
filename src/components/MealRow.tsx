import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../theme';

type Props = {
  mealType: string;
  title: string;
  kcal: number;
  photo?: string;
  onPress?: () => void;
  onDelete?: () => void;
};

export default function MealRow({ mealType, title, kcal, photo, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={[styles.row, shadow.soft]} activeOpacity={0.8} onPress={onPress}>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <View style={styles.photo} />}
      <View style={styles.info}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.kcal}>{kcal} kcal</Text>
      {onDelete && <TouchableOpacity onPress={onDelete} hitSlop={{top:10,bottom:10,left:10,right:10}}><Text style={styles.delete}>×</Text></TouchableOpacity>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  mealType: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  kcal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  delete: { fontSize: 22, color: colors.macroProtein, marginLeft: spacing.sm },
});
