import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../components/Avatar';
import SegmentedControl from '../components/SegmentedControl';
import { socialService, type ConnectionSummary } from '../services/api/social.service';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Connections'>;

const TABS = ['Requests', 'Sent', 'Connections'] as const;
type TabKey = typeof TABS[number];
const BOX: Record<TabKey, 'incoming' | 'outgoing' | 'accepted'> = {
  Requests: 'incoming',
  Sent: 'outgoing',
  Connections: 'accepted',
};

export default function ConnectionsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<TabKey>('Requests');
  const [rows, setRows] = useState<ConnectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async (t: TabKey) => {
    setLoading(true);
    try {
      setRows(await socialService.getConnections(BOX[t]));
    } catch (e) {
      Alert.alert('Unable to load', (e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(tab); }, [load, tab]));

  const act = async (row: ConnectionSummary, action: 'accept' | 'decline' | 'remove') => {
    if (busy[row.id]) return;
    setBusy((b) => ({ ...b, [row.id]: true }));
    setRows((cur) => cur.filter((r) => r.id !== row.id));
    try {
      if (action === 'accept') await socialService.acceptConnection(row.user.id);
      else if (action === 'decline') await socialService.declineConnection(row.user.id);
      else await socialService.removeConnection(row.user.id);
    } catch (e) {
      Alert.alert('Something went wrong', (e as Error).message);
      load(tab);
    } finally {
      setBusy((b) => ({ ...b, [row.id]: false }));
    }
  };

  const confirmRemove = (row: ConnectionSummary) =>
    Alert.alert('Remove connection?', `You will no longer be connected with ${row.user.name}. You will still be following them.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => act(row, 'remove') },
    ]);

  const emptyText =
    tab === 'Requests' ? 'No pending connection requests.'
      : tab === 'Sent' ? "You haven't sent any requests that are still pending."
      : 'No connections yet. Send a request from someone’s profile.';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Connections</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.tabsWrap}>
        <SegmentedControl options={TABS as unknown as string[]} value={tab} onChange={(v) => setTab(v as TabKey)} variant="pill" />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(x) => x.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            : <Text style={s.empty}>{emptyText}</Text>
        }
        renderItem={({ item }) => (
          <View style={s.row}>
            <TouchableOpacity
              style={s.identity}
              onPress={() => navigation.navigate('UserProfile', { userId: item.user.id, username: item.user.name })}
            >
              <Avatar uri={item.user.avatar || ''} size={46} />
              <View style={s.identityText}>
                <Text style={s.name} numberOfLines={1}>{item.user.name}</Text>
                {item.note
                  ? <Text style={s.note} numberOfLines={2}>{item.note}</Text>
                  : <Text style={s.meta} numberOfLines={1}>{item.user.bio || `Level ${item.user.level ?? 1}`}</Text>}
              </View>
            </TouchableOpacity>

            {tab === 'Requests' ? (
              <View style={s.actions}>
                <TouchableOpacity style={s.primaryBtn} onPress={() => act(item, 'accept')} disabled={busy[item.id]}>
                  <Text style={s.primaryBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.ghostBtn} onPress={() => act(item, 'decline')} disabled={busy[item.id]}>
                  <Text style={s.ghostBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            ) : tab === 'Sent' ? (
              <TouchableOpacity style={s.ghostBtn} onPress={() => act(item, 'remove')} disabled={busy[item.id]}>
                <Text style={s.ghostBtnText}>Withdraw</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.actions}>
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => navigation.navigate('DirectMessage', { userId: item.user.id, name: item.user.name, avatar: item.user.avatar })}
                >
                  <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => confirmRemove(item)}>
                  <Ionicons name="person-remove-outline" size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary },
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1 },
  name: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  note: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontStyle: 'italic', lineHeight: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  ghostBtn: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7, backgroundColor: colors.border },
  ghostBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
