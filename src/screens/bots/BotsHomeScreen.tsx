import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { botsService } from '../../services/api/bots.service';
import type { Bot, BotEvent } from '../../types/bots';

type Props = NativeStackScreenProps<RootStackParamList, 'Bots'>;

const EVENT_LABEL: Record<string, string> = {
  conversation_started: 'New conversation started',
  lead_collected: 'Lead collected',
  message_sent: 'Message sent',
  member_welcomed: 'Member welcomed',
  question_answered: 'Question answered',
  human_handoff: 'Human handoff requested',
  link_click: 'Link opened',
  action_completed: 'Automation ran',
  automation_failed: 'Automation failed',
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function BotsHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const spaceFilter = route.params ?? {};

  const [bots, setBots] = useState<Bot[]>([]);
  const [activity, setActivity] = useState<(BotEvent & { botName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const list = await botsService.list();
      setBots(list);
      const events = await Promise.all(
        list.slice(0, 6).map(async (b) => {
          try {
            const evs = await botsService.activity(b.id, 6);
            return evs.map((e) => ({ ...e, botName: b.name }));
          } catch {
            return [];
          }
        })
      );
      setActivity(
        events
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 12)
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = useMemo(() => {
    if (!spaceFilter.spaceId) return bots;
    return bots.filter((b) =>
      (b.connections ?? []).some((c) => c.space_id === spaceFilter.spaceId)
    );
  }, [bots, spaceFilter.spaceId]);

  const totals = useMemo(() => {
    const active = bots.filter((b) => b.status === 'active').length;
    const conversations = bots.reduce((n, b) => n + (b.stats?.conversationsStarted ?? 0), 0);
    const leads = bots.reduce((n, b) => n + (b.stats?.leadsCollected ?? 0), 0);
    return { active, conversations, leads };
  }, [bots]);

  const startCreate = () =>
    navigation.navigate('CreateBot', spaceFilter.spaceId ? {
      spaceType: spaceFilter.spaceType,
      spaceId: spaceFilter.spaceId,
      spaceName: spaceFilter.spaceName,
      presetType: 'space',
    } : undefined);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Bots</Text>
          <Text style={s.subtitle}>
            {spaceFilter.spaceName
              ? `Automations for ${spaceFilter.spaceName}`
              : 'Automate conversations and member activities'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <TouchableOpacity style={s.createBtn} onPress={startCreate} activeOpacity={0.9}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={s.createBtnText}>Create Bot</Text>
        </TouchableOpacity>

        <View style={s.statRow}>
          <Stat label="Active" value={totals.active} />
          <Stat label="Conversations" value={totals.conversations} />
          <Stat label="Leads" value={totals.leads} />
        </View>

        <Text style={s.sectionLabel}>MY BOTS</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : shown.length === 0 ? (
          <View style={[s.card, shadow.card]}>
            <Text style={s.emptyTitle}>No bots yet</Text>
            <Text style={s.emptyBody}>
              Create a bot to welcome members, answer questions and automate announcements — or a
              conversational bot with a shareable link for leads and customers.
            </Text>
          </View>
        ) : (
          shown.map((bot) => <BotCard key={bot.id} bot={bot} onPress={() => navigation.navigate('BotManage', { botId: bot.id })} />)
        )}

        <Text style={s.sectionLabel}>RECENT ACTIVITY</Text>
        <View style={[s.card, shadow.card]}>
          {activity.length === 0 ? (
            <Text style={s.emptyBody}>Nothing yet. Activity from your bots will show up here.</Text>
          ) : (
            activity.map((e, i) => (
              <View key={e.id} style={[s.activityRow, i === activity.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.activityIcon}>
                  <Ionicons
                    name={e.type === 'automation_failed' ? 'alert-circle-outline' : 'flash-outline'}
                    size={15}
                    color={e.type === 'automation_failed' ? colors.macroProtein : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.activityText}>{EVENT_LABEL[e.type] ?? e.type}</Text>
                  <Text style={s.activityMeta}>{e.botName} · {timeAgo(e.created_at)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={[s.stat, shadow.card]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function BotCard({ bot, onPress }: { bot: Bot; onPress: () => void }) {
  const connectedTo =
    bot.type === 'conversational'
      ? 'Standalone · shareable link'
      : (bot.connections ?? []).length
      ? (bot.connections ?? []).map((c) => c.space_name).filter(Boolean).join(', ') || `${bot.connections?.length} space(s)`
      : 'Not connected yet';
  return (
    <TouchableOpacity style={[s.card, shadow.card, s.botCard]} onPress={onPress} activeOpacity={0.85}>
      <View style={s.botAvatar}>
        {bot.avatar ? (
          <Image source={{ uri: bot.avatar }} style={s.botAvatarImg} />
        ) : (
          <Ionicons name={bot.type === 'conversational' ? 'chatbubbles-outline' : 'hardware-chip-outline'} size={20} color={colors.primary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.botTitleRow}>
          <Text style={s.botName} numberOfLines={1}>{bot.name}</Text>
          <View style={[s.pill, bot.status === 'active' ? s.pillActive : bot.status === 'paused' ? s.pillPaused : s.pillDraft]}>
            <Text style={[s.pillText, bot.status === 'active' && { color: colors.success }]}>
              {bot.status === 'active' ? 'Active' : bot.status === 'paused' ? 'Paused' : 'Draft'}
            </Text>
          </View>
        </View>
        <Text style={s.botMeta} numberOfLines={1}>{connectedTo}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  title: { ...typography.h1, fontSize: 24, color: colors.navy },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2,
  },
  createBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  botCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  botAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  botAvatarImg: { width: '100%', height: '100%' },
  botTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  botName: { flex: 1, fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  botMeta: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  pill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillActive: { backgroundColor: '#E7F9F0' },
  pillPaused: { backgroundColor: '#FFF3E0' },
  pillDraft: { backgroundColor: colors.background },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.textSecondary },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  emptyBody: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  errorText: { fontSize: 12.5, color: colors.macroProtein },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  activityMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
