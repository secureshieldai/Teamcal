import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { useClaudeAI } from '../../hooks/useClaudeAI';

const CAPTION_TONES = ['Professional', 'Casual', 'Funny', 'Motivational', 'Educational'] as const;
type CaptionTone = typeof CAPTION_TONES[number];

type Props = {
  visible: boolean;
  onClose: () => void;
  onUseCaption: (caption: string) => void;
};

export default function AIAssistantModal({ visible, onClose, onUseCaption }: Props) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<CaptionTone>(CAPTION_TONES[0]);
  const [generated, setGenerated] = useState<string | null>(null);
  const { generateCaption, loading } = useClaudeAI();

  const close = () => {
    setTopic('');
    setTone(CAPTION_TONES[0]);
    setGenerated(null);
    onClose();
  };

  const generate = async () => {
    if (!topic.trim()) return;
    try {
      const context = `Topic: ${topic}\nTone: ${tone}`;
      const result = await generateCaption(context);
      setGenerated(result);
    } catch (error) {
      console.error('Failed to generate caption:', error);
    }
  };

  const useIt = () => {
    if (generated) onUseCaption(generated);
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView 
        style={styles.backdrop} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={close}
        />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={(v) => { setTopic(v); setGenerated(null); }}
            placeholder="What do you want to post about?"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Text style={styles.toneLabel}>TONE</Text>
          <View style={styles.toneRow}>
            {CAPTION_TONES.map((option) => {
              const active = tone === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.toneChip, active && styles.toneChipActive]}
                  onPress={() => { setTone(option); setGenerated(null); }}
                >
                  <Text style={[styles.toneChipText, active && styles.toneChipTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {generated ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{generated}</Text>
            </View>
          ) : null}

          {generated ? (
            <TouchableOpacity onPress={useIt} activeOpacity={0.88} disabled={loading}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtn}>
                <Text style={styles.actionText}>Use this caption</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={generate} activeOpacity={0.88} disabled={loading || !topic.trim()}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtn}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.actionText}>Generate with Claude AI</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.5)', justifyContent: 'flex-end' },
  backdropTouchable: { flex: 1 },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  input: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, minHeight: 64, fontSize: 13.5, color: colors.textPrimary, textAlignVertical: 'top' },
  toneLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6, marginTop: -spacing.sm },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toneChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  toneChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toneChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  toneChipTextActive: { color: colors.white },
  previewBox: { backgroundColor: '#FDECE4', borderRadius: radii.lg, padding: spacing.lg },
  previewText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
  actionBtn: { borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
