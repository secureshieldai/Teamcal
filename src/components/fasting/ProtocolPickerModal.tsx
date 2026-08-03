import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { DEFAULT_PROTOCOL_ID, DIFFICULTY_STYLE, FASTING_PROTOCOLS } from '../../data/fastingData';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (protocolId: string, customTargetHours?: number) => void;
};

const CUSTOM_ID = 'custom';

export default function ProtocolPickerModal({ visible, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState(DEFAULT_PROTOCOL_ID);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');

  const confirm = () => {
    if (selected === CUSTOM_ID) {
      const hours = Number(customHours) || 0;
      const minutes = Number(customMinutes) || 0;
      const totalHours = hours + minutes / 60;
      if (totalHours <= 0) return;
      onConfirm(CUSTOM_ID, totalHours);
    } else {
      onConfirm(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose your fast</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {FASTING_PROTOCOLS.map((p) => {
              const isSelected = selected === p.id;
              const diff = DIFFICULTY_STYLE[p.difficulty];
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => setSelected(p.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{p.label}</Text>
                    <Text style={styles.rowDescription}>{p.description}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: diff.bg }]}>
                    <Text style={[styles.tagText, { color: diff.color }]}>{diff.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.row, selected === CUSTOM_ID && styles.rowSelected]}
              onPress={() => setSelected(CUSTOM_ID)}
              activeOpacity={0.8}
            >
              <View style={styles.customBadge}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Custom</Text>
                <Text style={styles.rowDescription}>Set your own hours & minutes</Text>
              </View>
            </TouchableOpacity>

            {selected === CUSTOM_ID && (
              <View style={styles.customInputsRow}>
                <TextInput
                  style={styles.customInput}
                  value={customHours}
                  onChangeText={setCustomHours}
                  keyboardType="number-pad"
                  placeholder="Hours"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.customInput}
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  keyboardType="number-pad"
                  placeholder="Minutes"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.beginButton} onPress={confirm} activeOpacity={0.85}>
            <Ionicons name="play" size={16} color={colors.white} />
            <Text style={styles.beginButtonText}>Begin fast</Text>
          </TouchableOpacity>
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
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  customBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rowDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  customInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  beginButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
