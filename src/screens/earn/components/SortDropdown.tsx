import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export default function SortDropdown({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Sort: {value}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, shadow.card]}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.row}
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <Text style={[styles.rowText, option === value && styles.rowTextActive]}>{option}</Text>
                {option === value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    fontSize: 12,
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
