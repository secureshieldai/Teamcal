import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { DRINK_PRESETS_ML, getDrinkType, type DrinkTypeId } from '../../data/waterData';

type Props = {
  typeId: DrinkTypeId | null;
  onClose: () => void;
  onSubmit: (typeId: DrinkTypeId, rawMl: number) => void;
};

export default function LogDrinkModal({ typeId, onClose, onSubmit }: Props) {
  const [customMl, setCustomMl] = useState('');
  const visible = typeId !== null;
  const type = typeId ? getDrinkType(typeId) : null;

  useEffect(() => {
    if (visible) setCustomMl('');
  }, [visible]);

  if (!type || !typeId) return null;

  const submit = (ml: number) => {
    if (ml > 0) onSubmit(typeId, ml);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: type.background }]}>
              <Ionicons name={type.icon} size={22} color={type.color} />
            </View>
            <Text style={styles.title}>Log {type.label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.presetsRow}>
            {DRINK_PRESETS_ML.map((ml) => (
              <TouchableOpacity key={ml} style={styles.presetChip} onPress={() => submit(ml)}>
                <Text style={styles.presetText}>{ml} ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.customLabel}>Custom amount (ml)</Text>
          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              value={customMl}
              onChangeText={setCustomMl}
              keyboardType="number-pad"
              placeholder="e.g. 200"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.logButton, !Number(customMl) && styles.logButtonDisabled]}
              disabled={!Number(customMl)}
              onPress={() => submit(Number(customMl))}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,43,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonDisabled: {
    opacity: 0.5,
  },
  logButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
