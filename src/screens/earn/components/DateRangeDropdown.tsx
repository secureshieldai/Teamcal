import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';
import { dateRangeOptions, type DateRangeKey } from '../../../data/earnData';

type Props = {
  value: DateRangeKey;
  onChange: (key: DateRangeKey) => void;
};

export default function DateRangeDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeLabel = dateRangeOptions.find((o) => o.key === value)?.label ?? 'Last 30 Days';

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={16} color={colors.textPrimary} />
        <Text style={styles.buttonText}>{activeLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, shadow.card]}>
            {dateRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.row}
                onPress={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
              >
                <Text style={[styles.rowText, option.key === value && styles.rowTextActive]}>{option.label}</Text>
                {option.key === value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,43,0.35)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
