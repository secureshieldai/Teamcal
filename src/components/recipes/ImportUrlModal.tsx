import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImport: (url: string) => Promise<void>;
};

export default function ImportUrlModal({ visible, onClose, onImport }: Props) {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const close = () => {
    if (importing) return;
    setUrl('');
    onClose();
  };

  const submit = async () => {
    if (!url.trim()) return;
    setImporting(true);
    try {
      await onImport(url);
      close();
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="link" size={16} color={colors.primary} />
              <Text style={styles.headerTitle}>Import from URL</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Paste a link from a blog, Instagram, or TikTok — we'll pull it into your recipe list.</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={[styles.importBtn, (!url.trim() || importing) && styles.importBtnDisabled]} onPress={submit} disabled={!url.trim() || importing} activeOpacity={0.88}>
            {importing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.importText}>Import</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: -spacing.sm },
  input: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, fontSize: 14, color: colors.textPrimary },
  importBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center' },
  importBtnDisabled: { opacity: 0.5 },
  importText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
