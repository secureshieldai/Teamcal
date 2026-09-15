import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';
import { COACH_TIPS } from '../../data/periodTrackerData';
import { coachService } from '../../services/api/coach.service';

type ChatMessage = { id: string; fromMe: boolean; text: string };

export default function CoachTab() {
  const { phase, cycleDay, nextPeriodInDays } = usePeriodTracker();
  const tips = COACH_TIPS[phase];

  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, fromMe: true, text }]);

    try {
      const { reply } = await coachService.sendMessage(text, { cyclePhase: phase, cycleDay, nextPeriodInDays });
      setMessages((prev) => [...prev, { id: `c-${Date.now()}`, fromMe: false, text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, fromMe: false, text: `Sorry, I couldn't respond right now. ${(e as Error).message}` }]);
    } finally {
      setSending(false);
    }
  }, [draft, sending, phase, cycleDay, nextPeriodInDays]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {tips.map((tip) => (
          <View key={tip.title} style={[styles.card, shadow.soft]}>
            <View style={styles.icon}>
              <Ionicons name={tip.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{tip.title}</Text>
              <Text style={styles.description}>{tip.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.chatDivider}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.chatDividerText}>Ask your coach anything</Text>
        </View>

        {!messages.length && (
          <Text style={styles.chatHint}>
            Ask about symptoms, workouts, nutrition or anything else about this phase of your cycle.
          </Text>
        )}

        {messages.map((m) => (
          <View key={m.id} style={[styles.bubbleRow, m.fromMe && styles.bubbleRowMe]}>
            <View style={[styles.bubble, m.fromMe ? styles.bubbleMe : styles.bubbleCoach]}>
              <Text style={[styles.bubbleText, m.fromMe && styles.bubbleTextMe]}>{m.text}</Text>
            </View>
          </View>
        ))}
        {sending && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask about this phase..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={!sending}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending || !draft.trim()}>
          {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={16} color={colors.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  description: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  chatDivider: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  chatDividerText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  chatHint: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  bubbleRow: { alignItems: 'flex-start' },
  bubbleRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  bubbleCoach: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleMe: { backgroundColor: colors.primary },
  bubbleText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
