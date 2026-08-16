import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

type Props = {
  visible: boolean;
  loading: boolean;
  items: string[];
  onClose: () => void;
  onAddToShoppingList: (items: string[]) => Promise<void> | void;
};

export default function GroceryListModal({ visible, loading, items, onClose, onAddToShoppingList }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (visible) setChecked(Object.fromEntries(items.map((item) => [item, true])));
  }, [visible, items]);

  const toggle = (item: string) => setChecked((prev) => ({ ...prev, [item]: !prev[item] }));

  const addToShoppingList = async () => {
    const selected = items.filter((item) => checked[item]);
    if (!selected.length) return;
    setAdding(true);
    try {
      await onAddToShoppingList(selected);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Grocery list</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>No meals planned for this day yet.</Text>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <TouchableOpacity key={item} style={styles.row} onPress={() => toggle(item)} activeOpacity={0.7}>
                  <Ionicons name={checked[item] ? 'checkbox' : 'square-outline'} size={22} color={checked[item] ? colors.primary : colors.textMuted} />
                  <Text style={styles.rowText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.6 }]}
              onPress={addToShoppingList}
              disabled={adding || items.every((item) => !checked[item])}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>{adding ? 'Adding…' : 'Add to shopping list'}</Text>
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
    maxHeight: '75%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  list: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  doneBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
