import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { botsService } from '../../services/api/bots.service';
import type { Bot, BotAutomation, BotKnowledgeBase, BotMessage, BotPermissionKey } from '../../types/bots';

type Props = NativeStackScreenProps<RootStackParamList, 'BotManage'>;
type Section = 'overview' | 'automations' | 'knowledge' | 'permissions' | 'welcome' | 'activity' | 'test';

const AUTOMATION_LABELS: Record<string, string> = {
  welcome_dm: 'Welcome new members', onboarding: 'Onboarding steps', faq: 'Answer questions',
  announcement: 'Announcements', reminder: 'Reminders', poll: 'Polls & quizzes',
  recommend_resource: 'Recommend resources', spam_detect: 'Spam detection', notify_admins: 'Notify admins',
  confirm_membership: 'Confirm membership', manage_access: 'Manage access', collect_replies: 'Collect private replies',
  escalate: 'Escalate to human',
};
const PERMISSION_LABELS: Record<BotPermissionKey, string> = {
  send_dms: 'Send private messages', publish_announcements: 'Publish / schedule announcements',
  view_member_info: 'View basic member info', create_polls: 'Create polls or quizzes',
  moderate_content: 'Moderate messages or comments', access_resources: 'Access selected resources',
  manage_membership_access: 'Manage membership access', collect_lead_info: 'Collect approved lead info',
  display_products: 'Display selected products', open_checkout: 'Open approved checkout / booking',
  notify_admins: 'Notify / transfer to admins',
};

export default function BotManageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { botId } = route.params;

  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<Section>('overview');

  const load = useCallback(async () => {
    try {
      setBot(await botsService.get(botId));
    } catch (e) {
      Alert.alert('Could not load bot', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleStatus = async () => {
    if (!bot) return;
    setBusy(true);
    try {
      const next = bot.status === 'active' ? await botsService.pause(bot.id) : await botsService.activate(bot.id);
      setBot({ ...bot, status: next.status });
    } catch (e) {
      Alert.alert('Could not update', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!bot?.public_slug) return;
    await Clipboard.setStringAsync(`teamcal://b/${bot.public_slug}`);
    Alert.alert('Link copied', `teamcal.app/b/${bot.public_slug}`);
  };

  const confirmDelete = () => {
    Alert.alert('Delete bot?', 'This permanently removes the bot, its automations, conversations and leads.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await botsService.remove(botId); navigation.goBack(); }
          catch (e) { Alert.alert('Could not delete', (e as Error).message); }
        },
      },
    ]);
  };

  if (loading || !bot) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const stats = bot.stats;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (section === 'overview' ? navigation.goBack() : setSection('overview'))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{bot.name}</Text>
          <Text style={[s.status, bot.status === 'active' && { color: colors.success }]}>
            {bot.status === 'active' ? '● Active' : bot.status === 'paused' ? '● Paused' : '● Draft'}
          </Text>
        </View>
        <TouchableOpacity style={s.statusBtn} disabled={busy} onPress={toggleStatus}>
          <Text style={s.statusBtnText}>{bot.status === 'active' ? 'Pause' : 'Activate'}</Text>
        </TouchableOpacity>
      </View>

      {section === 'overview' && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>LAST 30 DAYS</Text>
          <View style={s.statGrid}>
            <StatBox value={stats?.membersWelcomed ?? 0} label="Welcomed" />
            <StatBox value={stats?.questionsAnswered ?? 0} label="Answered" />
            <StatBox value={stats?.conversationsStarted ?? 0} label="Conversations" />
            <StatBox value={stats?.leadsCollected ?? 0} label="Leads" />
            <StatBox value={stats?.messagesSent ?? 0} label="Messages" />
            <StatBox value={stats?.humanHandoffs ?? 0} label="Handoffs" />
            <StatBox value={stats?.linkClicks ?? 0} label="Link clicks" />
            <StatBox value={stats?.actionsCompleted ?? 0} label="Actions" />
            <StatBox value={stats?.failedAutomations ?? 0} label="Failed" danger={(stats?.failedAutomations ?? 0) > 0} />
          </View>

          <Text style={s.sectionLabel}>MANAGE</Text>
          <View style={[s.card, shadow.card]}>
            <Row icon="create-outline" label="Edit details" onPress={() => setSection('welcome')} />
            {bot.type === 'space' && <Row icon="flash-outline" label="Automations" onPress={() => setSection('automations')} />}
            <Row icon="book-outline" label="Knowledge Base" onPress={() => setSection('knowledge')} />
            <Row icon="shield-checkmark-outline" label="Permissions" onPress={() => setSection('permissions')} />
            <Row icon="chatbubble-ellipses-outline" label="Test bot" onPress={() => setSection('test')} />
            <Row icon="pulse-outline" label="Recent activity" onPress={() => setSection('activity')} />
            {bot.type === 'conversational' && <Row icon="link-outline" label="Copy public link" onPress={copyLink} />}
            <Row icon="trash-outline" label="Delete bot" danger onPress={confirmDelete} last />
          </View>

          {bot.type === 'space' && (
            <>
              <Text style={s.sectionLabel}>CONNECTED SPACES</Text>
              <View style={[s.card, shadow.card]}>
                {(bot.connections ?? []).length === 0 ? (
                  <Text style={s.muted}>Not connected to any space.</Text>
                ) : (
                  (bot.connections ?? []).map((c) => (
                    <View key={`${c.space_type}:${c.space_id}`} style={s.connRow}>
                      <Ionicons name={c.space_type === 'channel' ? 'megaphone-outline' : 'people-outline'} size={16} color={colors.textSecondary} />
                      <Text style={s.connName}>{c.space_name || c.space_id}</Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {section === 'welcome' && <EditDetails bot={bot} onSaved={(b) => { setBot(b); setSection('overview'); }} />}
      {section === 'automations' && <AutomationsEditor bot={bot} onSaved={load} />}
      {section === 'knowledge' && <KnowledgeEditor bot={bot} onSaved={(kb) => setBot({ ...bot, knowledge_base: kb })} />}
      {section === 'permissions' && <PermissionsEditor bot={bot} onSaved={(b) => setBot(b)} />}
      {section === 'activity' && <ActivityList botId={bot.id} />}
      {section === 'test' && <TestChat botId={bot.id} />}
    </SafeAreaView>
  );
}

// ── Overview helpers ─────────────────────────────────────────
function StatBox({ value, label, danger }: { value: number; label: string; danger?: boolean }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statBoxValue, danger && { color: colors.macroProtein }]}>{value}</Text>
      <Text style={s.statBoxLabel}>{label}</Text>
    </View>
  );
}
function Row({ icon, label, onPress, danger, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <TouchableOpacity style={[s.row, last && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Ionicons name={icon} size={19} color={danger ? colors.macroProtein : colors.textPrimary} />
      <Text style={[s.rowLabel, danger && { color: colors.macroProtein }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ── Edit details ─────────────────────────────────────────────
function EditDetails({ bot, onSaved }: { bot: Bot; onSaved: (b: Bot) => void }) {
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description ?? '');
  const [purpose, setPurpose] = useState(bot.purpose ?? '');
  const [welcome, setWelcome] = useState(bot.welcome_message ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const updated = await botsService.update(bot.id, { name, description, purpose, welcome_message: welcome });
      onSaved({ ...bot, ...updated });
    } catch (e) { Alert.alert('Could not save', (e as Error).message); }
    finally { setSaving(false); }
  };
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Labeled label="Name"><TextInput style={s.input} value={name} onChangeText={setName} /></Labeled>
      <Labeled label="Short description"><TextInput style={[s.input, s.inputMulti]} value={description} onChangeText={setDescription} multiline /></Labeled>
      <Labeled label="Purpose"><TextInput style={[s.input, s.inputMulti]} value={purpose} onChangeText={setPurpose} multiline /></Labeled>
      <Labeled label="Welcome message"><TextInput style={[s.input, s.inputMulti]} value={welcome} onChangeText={setWelcome} multiline /></Labeled>
      <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={save}><Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

// ── Automations editor ───────────────────────────────────────
function AutomationsEditor({ bot, onSaved }: { bot: Bot; onSaved: () => void }) {
  const initial = useMemo(() => {
    const map: Record<string, BotAutomation> = {};
    Object.keys(AUTOMATION_LABELS).forEach((k) => { map[k] = { kind: k as BotAutomation['kind'], enabled: false, config: {} }; });
    (bot.automations ?? []).forEach((a) => { map[a.kind] = a; });
    return map;
  }, [bot.automations]);
  const [map, setMap] = useState(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await botsService.setAutomations(bot.id, Object.values(map));
      onSaved();
      Alert.alert('Saved', 'Automations updated.');
    } catch (e) { Alert.alert('Could not save', (e as Error).message); }
    finally { setSaving(false); }
  };
  return (
    <ScrollView contentContainerStyle={s.content}>
      {Object.entries(AUTOMATION_LABELS).map(([kind, label]) => (
        <View key={kind} style={s.toggleRow}>
          <Text style={s.toggleLabel}>{label}</Text>
          <Switch
            value={!!map[kind]?.enabled}
            onValueChange={(v) => setMap((p) => ({ ...p, [kind]: { ...p[kind], kind: kind as BotAutomation['kind'], enabled: v } }))}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      ))}
      <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={save}><Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save automations'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

// ── Knowledge editor ─────────────────────────────────────────
function KnowledgeEditor({ bot, onSaved }: { bot: Bot; onSaved: (kb: BotKnowledgeBase) => void }) {
  const kb0 = bot.knowledge_base ?? {};
  const [business, setBusiness] = useState(kb0.business ?? '');
  const [hours, setHours] = useState(kb0.hours ?? '');
  const [products, setProducts] = useState((kb0.products ?? []).join('\n'));
  const [prices, setPrices] = useState((kb0.prices ?? []).join('\n'));
  const [faqs, setFaqs] = useState((kb0.faqs ?? []).map((f) => `${f.q} ${f.a}`).join('\n'));
  const [refunds, setRefunds] = useState(kb0.refunds ?? '');
  const [booking, setBooking] = useState(kb0.booking ?? '');
  const [instructions, setInstructions] = useState(kb0.instructions ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const kb: BotKnowledgeBase = {
        ...kb0,
        business, hours, refunds, booking, instructions,
        products: products.split('\n').map((x) => x.trim()).filter(Boolean),
        prices: prices.split('\n').map((x) => x.trim()).filter(Boolean),
        faqs: faqs.split('\n').map((x) => x.trim()).filter(Boolean).map((line) => {
          const i = line.indexOf('?');
          return i === -1 ? { q: line, a: '' } : { q: line.slice(0, i + 1).trim(), a: line.slice(i + 1).trim() };
        }),
      };
      const saved = await botsService.setKnowledge(bot.id, kb);
      onSaved(saved);
      Alert.alert('Saved', 'Knowledge Base updated.');
    } catch (e) { Alert.alert('Could not save', (e as Error).message); }
    finally { setSaving(false); }
  };
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.muted}>The bot answers only from this. If something is missing it says so and offers a human.</Text>
      <Labeled label="Business information"><TextInput style={[s.input, s.inputMulti]} value={business} onChangeText={setBusiness} multiline /></Labeled>
      <Labeled label="Products & services (one per line)"><TextInput style={[s.input, s.inputMulti]} value={products} onChangeText={setProducts} multiline /></Labeled>
      <Labeled label="Prices & plans (one per line)"><TextInput style={[s.input, s.inputMulti]} value={prices} onChangeText={setPrices} multiline /></Labeled>
      <Labeled label="FAQs (Question? Answer — one per line)"><TextInput style={[s.input, s.inputMulti]} value={faqs} onChangeText={setFaqs} multiline /></Labeled>
      <Labeled label="Opening hours"><TextInput style={s.input} value={hours} onChangeText={setHours} /></Labeled>
      <Labeled label="Refund & cancellation policy"><TextInput style={[s.input, s.inputMulti]} value={refunds} onChangeText={setRefunds} multiline /></Labeled>
      <Labeled label="Booking information"><TextInput style={[s.input, s.inputMulti]} value={booking} onChangeText={setBooking} multiline /></Labeled>
      <Labeled label="Extra instructions"><TextInput style={[s.input, s.inputMulti]} value={instructions} onChangeText={setInstructions} multiline /></Labeled>
      <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={save}><Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Knowledge Base'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

// ── Permissions editor ───────────────────────────────────────
function PermissionsEditor({ bot, onSaved }: { bot: Bot; onSaved: (b: Bot) => void }) {
  const [perms, setPerms] = useState<Partial<Record<BotPermissionKey, boolean>>>(bot.permissions ?? {});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const updated = await botsService.update(bot.id, { permissions: perms });
      onSaved({ ...bot, ...updated });
      Alert.alert('Saved', 'Permissions updated.');
    } catch (e) { Alert.alert('Could not save', (e as Error).message); }
    finally { setSaving(false); }
  };
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.muted}>Choose exactly what the bot may do. Nothing is granted automatically.</Text>
      {(Object.keys(PERMISSION_LABELS) as BotPermissionKey[]).map((key) => (
        <View key={key} style={s.toggleRow}>
          <Text style={s.toggleLabel}>{PERMISSION_LABELS[key]}</Text>
          <Switch value={!!perms[key]} onValueChange={(v) => setPerms((p) => ({ ...p, [key]: v }))} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
      ))}
      <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={save}><Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save permissions'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

// ── Activity list ────────────────────────────────────────────
function ActivityList({ botId }: { botId: string }) {
  const [events, setEvents] = useState<{ id: string; type: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    botsService.activity(botId, 50).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, [botId]));
  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  return (
    <ScrollView contentContainerStyle={s.content}>
      {events.length === 0 ? <Text style={s.muted}>No activity yet.</Text> : events.map((e) => (
        <View key={e.id} style={s.activityRow}>
          <Text style={s.activityText}>{AUTOMATION_LABELS[e.type] ?? e.type.replace(/_/g, ' ')}</Text>
          <Text style={s.activityMeta}>{new Date(e.created_at).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Test chat ────────────────────────────────────────────────
function TestChat({ botId }: { botId: string }) {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText('');
    const history = [...messages, { role: 'user' as const, content: msg }];
    setMessages(history);
    setBusy(true);
    try {
      const res = await botsService.test(botId, msg, messages);
      setMessages([...history, { role: 'bot', content: res.reply }]);
    } catch (e) {
      setMessages([...history, { role: 'system', content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.muted}>Preview how the bot replies. Nothing here is saved or sent.</Text>
        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : m.role === 'system' ? s.bubbleSystem : s.bubbleBot]}>
            <Text style={[s.bubbleText, m.role === 'user' && { color: colors.white }]}>{m.content}</Text>
          </View>
        ))}
        {busy && <Text style={s.muted}>Bot is typing…</Text>}
      </ScrollView>
      <View style={s.composer}>
        <TextInput style={s.composerInput} value={text} onChangeText={setText} placeholder="Type a test message" placeholderTextColor={colors.textMuted} />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={busy}><Ionicons name="send" size={16} color={colors.white} /></TouchableOpacity>
      </View>
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  title: { ...typography.h2, fontSize: 17, color: colors.textPrimary },
  status: { fontSize: 11.5, color: colors.textMuted, marginTop: 1, fontWeight: '700' },
  statusBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  statusBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statBox: { width: '31.5%', backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.md, alignItems: 'center' },
  statBoxValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statBoxLabel: { fontSize: 9.5, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  connName: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  muted: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary, paddingRight: spacing.md },
  activityRow: { paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  activityMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  bubble: { maxWidth: '85%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.card },
  bubbleSystem: { alignSelf: 'center', backgroundColor: colors.background },
  bubbleText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  composerInput: { flex: 1, backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
