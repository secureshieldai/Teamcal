import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { coachService, type ArticleHelperAction } from '../services/api/coach.service';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AIHelper'>;

type Message = { id: string; role: 'user' | 'assistant'; text: string; insertable?: boolean };

const QUICK_ACTIONS: { action: ArticleHelperAction; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; userLabel: string }[] = [
  { action: 'write', label: 'Write a blog post\nabout a topic', icon: 'create-outline', color: '#7C5CFC', bg: '#EDE9FE', userLabel: 'Write a blog post about my topic' },
  { action: 'outline', label: 'Create an outline\nfor my article', icon: 'list-outline', color: '#E8A33D', bg: '#FDECC8', userLabel: 'Create an outline for my article' },
  { action: 'intro', label: 'Write an engaging\nintroduction', icon: 'chatbox-ellipses-outline', color: '#3E7BFA', bg: '#E3F0FD', userLabel: 'Write an engaging introduction' },
  { action: 'titles', label: 'Suggest blog post\ntitles for my topic', icon: 'document-text-outline', color: '#E0568F', bg: '#FCE3EE', userLabel: 'Suggest blog post titles for my topic' },
  { action: 'improve', label: 'Improve my\nexisting content', icon: 'sparkles-outline', color: '#7C5CFC', bg: '#EDE9FE', userLabel: 'Improve my existing content' },
];

export default function AIHelperScreen({ navigation, route }: Props) {
  const { blogId, articleId, existingContent } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState('500');
  const [showWordCount, setShowWordCount] = useState(false);

  const notAvailable = () => Alert.alert('Not available yet', 'This isn\'t supported in this build yet.');

  const run = async (action: ArticleHelperAction, topic: string, userLabel: string) => {
    if (action === 'chat' && userLabel.includes('image')) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: userLabel },
        { id: `a-${Date.now()}`, role: 'assistant', text: "I can't generate images yet — use the \"Upload cover image\" button on the editor instead." },
      ]);
      return;
    }
    
    // Show word count input for "write" action
    if (action === 'write' && !showWordCount) {
      setShowWordCount(true);
      return;
    }
    
    const finalLabel = action === 'write' && wordCount ? `${userLabel} (${wordCount} words)` : userLabel;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: finalLabel }]);
    setLoading(true);
    setShowWordCount(false);
    try {
      const result = await coachService.generateArticleContent({
        action,
        topic: topic || 'this article',
        wordCount: action === 'write' && wordCount ? parseInt(wordCount) : undefined,
        existingContent: action === 'improve' ? existingContent || '' : undefined,
      });
      const text = action === 'titles' ? (result.titles || []).map((t) => `- ${t}`).join('\n') : result.text || '';
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text, insertable: true }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: `Something went wrong: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendFreeText = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    run('chat', text, text);
  };

  const insert = (text: string) => {
    navigation.navigate('ArticleEditor', { blogId, articleId, insertText: text });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Helper</Text>
        </View>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.introRow}>
            <View style={styles.introIcon}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Hi! I'm your AI writing assistant</Text>
              <Text style={styles.introSubtitle}>I can help you brainstorm ideas, write content, improve it, and more.</Text>
            </View>
          </View>

          {!messages.length && (
            <>
              <Text style={styles.sectionLabel}>Get started</Text>
              
              {showWordCount && (
                <View style={styles.wordCountBox}>
                  <Text style={styles.wordCountLabel}>How many words would you like?</Text>
                  <View style={styles.wordCountInputRow}>
                    <TextInput
                      style={styles.wordCountInput}
                      value={wordCount}
                      onChangeText={setWordCount}
                      placeholder="500"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.wordCountSuffix}>words</Text>
                  </View>
                  <View style={styles.wordCountActions}>
                    <TouchableOpacity style={styles.wordCountCancelBtn} onPress={() => setShowWordCount(false)}>
                      <Text style={styles.wordCountCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.wordCountGenerateBtn} 
                      onPress={() => run('write', '', 'Write a blog post about my topic')}
                    >
                      <Text style={styles.wordCountGenerateText}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <View style={styles.grid}>
                {QUICK_ACTIONS.map((qa) => (
                  <TouchableOpacity key={qa.userLabel} style={[styles.actionCard, shadow.soft]} activeOpacity={0.85} onPress={() => run(qa.action, '', qa.userLabel)}>
                    <View style={[styles.actionIcon, { backgroundColor: qa.bg }]}>
                      <Ionicons name={qa.icon} size={18} color={qa.color} />
                    </View>
                    <Text style={styles.actionLabel}>{qa.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or ask me anything</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.role === 'user' && styles.bubbleRowUser]}>
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>{m.text}</Text>
              </View>
              {m.insertable && m.text ? (
                <TouchableOpacity style={styles.insertBtn} onPress={() => insert(m.text)}>
                  <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.insertText}>Insert into article</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={sendFreeText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendFreeText} disabled={!input.trim() || loading}>
            <Ionicons name="arrow-up" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  introRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  introIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: 15.5, fontWeight: '800', color: colors.textPrimary },
  introSubtitle: { fontSize: 12.5, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  sectionLabel: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
  wordCountBox: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.primary, marginBottom: spacing.md },
  wordCountLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  wordCountInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wordCountInput: { flex: 1, backgroundColor: colors.background, borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, fontWeight: '700', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  wordCountSuffix: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  wordCountActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  wordCountCancelBtn: { flex: 1, backgroundColor: colors.background, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  wordCountCancelText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  wordCountGenerateBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  wordCountGenerateText: { fontSize: 14, fontWeight: '700', color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textPrimary, lineHeight: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted },
  bubbleRow: { alignItems: 'flex-start', gap: spacing.xs },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  bubbleAssistant: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleUser: { backgroundColor: colors.primary },
  bubbleText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: colors.white },
  insertBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
  insertText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
