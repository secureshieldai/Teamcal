import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

type Day = { key: string; label: string; date: number };

type Props = {
  days: Day[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export default function WeekDaySelector({ days, selectedKey, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => {
        const active = day.key === selectedKey;
        return (
          <TouchableOpacity key={day.key} style={styles.item} onPress={() => onSelect(day.key)}>
            <Text style={[styles.label, active && styles.labelActive]}>{day.label}</Text>
            <View style={[styles.dateCircle, active && styles.dateCircleActive]}>
              <Text style={[styles.date, active && styles.dateActive]}>{day.date}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    width: 44,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  labelActive: {
    color: colors.primary,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: colors.primary,
  },
  date: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateActive: {
    color: colors.white,
  },
});
