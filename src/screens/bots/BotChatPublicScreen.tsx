import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { botsService } from '../../services/api/bots.service';
import type { BotMessage } from '../../types/bots';

type Props = NativeStackScreenProps<RootStackParamList, 'BotChatPublic'>;

export default function BotChatPublicScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { slug } = route.params;

  const [profile, setProfile] = useState<{ name: string; avatar?: string; description?: string; disclosure: string } | null>(null);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [handoff, setHandoff] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const scrollRef = useRef<ScrollView>(null);
  const lastTs = useRef<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const [p, session] = await Promise.all([botsService.publicGet(slug), botsService.publicStart(slug)]);
        setProfile(p);
        setConversationId(session.conversationId);
        setMessages(session.messages);
      } catch (e) {
        setError((e as Error).message || 'This bot is not available.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Poll for human replies once a handoff is active.
  useEffect(() => {
    if (!conversationId || stopped) return;
    const timer = setInterval(async () => {
      try {
        const res = await botsService.publicPoll(slug, conversationId, lastTs.current);
        setHandoff(res.handoff_active);
        setStopped(res.stopped);
        if (res.messages.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.created_at));
            const fresh = res.messages.filter((m) => m.created_at && !known.has(m.created_at));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastTs.current = res.messages[res.messages.length - 1].created_at;
        }
      } catch {
        /* ignore poll errors */
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [conversationId, slug, stopped]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = useCallback(async () => {
    const msg = text.trim();
    if (!msg || busy || stopped) return;
    setText('');
    setMessages((prev) => [...prev, { role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setBusy(true);
    try {
      const res = await botsService.publicSend(slug, conversationId, msg);
      if (res.reply) {
        setMessages((prev) => [...prev, { role: 'bot', content: res.reply as string, created_at: new Date().toISOString() }]);
      }
      if (res.handoffSuggested) setHandoff(false);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'system', content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }, [text, busy, stopped, slug, conversationId]);

  const requestHuman = async () => {
    try {
      await botsService.publicHandoff(slug, conversationId);
      setMessages((prev) => [...prev, { role: 'system', content: 'Your request to speak with a person has been sent.' }]);
    } catch (e) {
      Alert.alert('Could not send request', (e as Error).message);
    }
  };

  const submitLead = async () => {
    try {
      await botsService.publicLead(slug, conversationId, { ...lead, consent: true });
      setShowLead(false);
      setMessages((prev) => [...prev, { role: 'system', content: 'Thanks — your details were shared with the team.' }]);
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    }
  };

  const stop = () => {
    Alert.alert('Stop this chat?', 'The bot will stop messaging you. You can also ask to delete anything you submitted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop only', onPress: () => doStop(false) },
      { text: 'Stop & delete my details', style: 'destructive', onPress: () => doStop(true) },
    ]);
  };
  const doStop = async (deleteData: boolean) => {
    try {
      await botsService.publicStop(slug, conversationId, { deleteData });
      setStopped(true);
      setMessages((prev) => [...prev, { role: 'system', content: 'This conversation has been stopped.' }]);
    } catch (e) {
      Alert.alert('Could not stop', (e as Error).message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.link}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerAvatar}><Ionicons name="chatbubbles" size={16} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName} numberOfLines={1}>{profile?.name}</Text>
          <Text style={s.headerTag}>Automated assistant{handoff ? ' · a person has joined' : ''}</Text>
        </View>
        <TouchableOpacity onPress={stop} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={s.disclosure}>
        <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
        <Text style={s.disclosureText}>{profile?.disclosure}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={s.messages}>
          {messages.map((m, i) => (
            <View
              key={m.created_at ?? i}
              style={[s.bubble, m.role === 'user' ? s.bubbleUser : m.role === 'system' ? s.bubbleSystem : s.bubbleBot]}
            >
              {m.role === 'admin' && <Text style={s.adminTag}>Team member</Text>}
              <Text style={[s.bubbleText, m.role === 'user' && { color: colors.white }, m.role === 'system' && s.systemText]}>
                {m.content}
              </Text>
            </View>
          ))}
          {busy && <Text style={s.typing}>…</Text>}
        </ScrollView>

        {!stopped && (
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.chip} onPress={() => setShowLead((v) => !v)}>
              <Ionicons name="person-add-outline" size={13} color={colors.primary} />
              <Text style={s.chipText}>Share my details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.chip} onPress={requestHuman}>
              <Ionicons name="headset-outline" size={13} color={colors.primary} />
              <Text style={s.chipText}>Talk to a person</Text>
            </TouchableOpacity>
          </View>
        )}

        {showLead && !stopped && (
          <View style={s.leadCard}>
            <Text style={s.leadTitle}>Share your contact details</Text>
            <Text style={s.leadConsent}>
              These are sent to the team only to follow up about your enquiry. You can ask to delete them anytime.
            </Text>
            <TextInput style={s.leadInput} placeholder="Name" placeholderTextColor={colors.textMuted} value={lead.name} onChangeText={(v) => setLead({ ...lead, name: v })} />
            <TextInput style={s.leadInput} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" value={lead.email} onChangeText={(v) => setLead({ ...lead, email: v })} />
            <TextInput style={s.leadInput} placeholder="Phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={lead.phone} onChangeText={(v) => setLead({ ...lead, phone: v })} />
            <TouchableOpacity style={s.leadBtn} onPress={submitLead}>
              <Text style={s.leadBtnText}>Agree & send</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.composer}>
          <TextInput
            style={s.composerInput}
            value={text}
            onChangeText={setText}
            placeholder={stopped ? 'This chat has been stopped' : 'Type a message'}
            placeholderTextColor={colors.textMuted}
            editable={!stopped}
            onSubmitEditing={send}
          />
          <TouchableOpacity style={[s.sendBtn, stopped && { opacity: 0.4 }]} onPress={send} disabled={stopped || busy}>
            <Ionicons name="send" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  headerTag: { fontSize: 10.5, color: colors.textSecondary, marginTop: 1 },
  disclosure: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: '#FFF8F5' },
  disclosureText: { fontSize: 10.5, color: colors.textSecondary, flex: 1 },
  messages: { padding: spacing.lg, gap: spacing.sm },
  bubble: { maxWidth: '84%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.card },
  bubbleSystem: { alignSelf: 'center', backgroundColor: 'transparent' },
  bubbleText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  systemText: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  adminTag: { fontSize: 9.5, fontWeight: '800', color: colors.primary, marginBottom: 2 },
  typing: { alignSelf: 'flex-start', fontSize: 18, color: colors.textMuted, paddingLeft: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  leadCard: { margin: spacing.lg, marginTop: 0, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  leadTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  leadConsent: { fontSize: 10.5, color: colors.textSecondary, lineHeight: 15, marginTop: 4, marginBottom: spacing.sm },
  leadInput: { backgroundColor: colors.background, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.sm },
  leadBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  leadBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  composerInput: { flex: 1, backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
