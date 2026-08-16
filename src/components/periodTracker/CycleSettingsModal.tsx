import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { CycleSettings } from '../../hooks/usePeriodTracker';

type Mode = CycleSettings['mode'];
const MODES: { id: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'tracking', label: 'Tracking', icon: 'heart' },
  { id: 'trying', label: 'Trying', icon: 'radio-button-on' },
  { id: 'pregnant', label: 'Pregnant', icon: 'happy' },
];

type Props = {
  visible: boolean;
  settings: CycleSettings;
  onClose: () => void;
  onSave: (patch: Partial<CycleSettings>) => Promise<void>;
};

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>
          {value} <Text style={styles.stepperUnit}>days</Text>
        </Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CycleSettingsModal({ visible, settings, onClose, onSave }: Props) {
  const [mode, setMode] = useState<Mode>(settings.mode);
  const [cycleLength, setCycleLength] = useState(settings.cycleLength);
  const [periodLength, setPeriodLength] = useState(settings.periodLength);
  const [lutealLength, setLutealLength] = useState(settings.lutealLength);
  const [shareWithPartner, setShareWithPartner] = useState(settings.shareWithPartner);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode(settings.mode);
      setCycleLength(settings.cycleLength);
      setPeriodLength(settings.periodLength);
      setLutealLength(settings.lutealLength);
      setShareWithPartner(settings.shareWithPartner);
    }
  }, [visible, settings]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ mode, cycleLength, periodLength, lutealLength, shareWithPartner });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Cycle settings</Text>
          <Text style={styles.subtitle}>Personalize predictions and coaching.</Text>

          <Text style={styles.sectionLabel}>MODE</Text>
          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <TouchableOpacity key={m.id} style={[styles.modeChip, active && styles.modeChipActive]} onPress={() => setMode(m.id)}>
                  <Ionicons name={m.icon} size={16} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />
          <Stepper label="Cycle length" value={cycleLength} onChange={setCycleLength} min={18} max={45} />
          <View style={styles.divider} />
          <Stepper label="Period length" value={periodLength} onChange={setPeriodLength} min={1} max={10} />
          <View style={styles.divider} />
          <Stepper label="Luteal length" value={lutealLength} onChange={setLutealLength} min={8} max={18} />
          <View style={styles.divider} />

          <TouchableOpacity style={styles.shareRow} onPress={() => setShareWithPartner((v) => !v)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareTitle}>Share with partner</Text>
              <Text style={styles.shareSubtitle}>Phase & mood only, never symptoms</Text>
            </View>
            <Ionicons name={shareWithPartner ? 'checkbox' : 'square-outline'} size={22} color={shareWithPartner ? colors.primary : colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
  },
  modeChipActive: { borderColor: colors.primary, backgroundColor: '#FFF3EC' },
  modeText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  modeTextActive: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, minWidth: 60, textAlign: 'center' },
  stepperUnit: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  shareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  shareTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  shareSubtitle: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  footerRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
