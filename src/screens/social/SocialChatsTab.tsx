import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../../components/SegmentedControl';
import ChatRow from '../../components/social/ChatRow';
import RequestRow from '../../components/social/RequestRow';
import { colors, radii, spacing } from '../../theme';
import { chatsSubTabs } from '../../data/communityData';
import { socialService, type MessageRequest, type SocialConversation } from '../../services/api/social.service';
import { subscribeToInbox } from '../../services/realtime';
import type { RootStackParamList } from '../../navigation/types';

function labelFor(tab: string, unreadCount: number, requestCount: number) {
  if (tab === 'Requests' && requestCount) return `Requests · ${requestCount}`;
  if (tab === 'Unread' && unreadCount) return `Unread · ${unreadCount}`;
  return tab;
}

export default function SocialChatsTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [subTab, setSubTab] = useState(chatsSubTabs[0]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [conversations, setConversations] = useState<SocialConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [items, pending] = await Promise.all([socialService.getConversations(), socialService.getMessageRequests()]);
      setConversations(items);
      setRequests(pending);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Live refresh while the tab is mounted (new message, read receipt, accepted request).
  useEffect(() => {
    let cleanup = () => undefined as void;
    subscribeToInbox({ onMessage: () => load(), onRead: () => load(), onRequestAccepted: () => load() }).then((fn) => { cleanup = fn; });
    return () => cleanup();
  }, [load]);

  const action = async (request: MessageRequest, value: 'accept' | 'decline' | 'block') => {
    try {
      await socialService.actOnMessageRequest(request.user.id, value);
      setRequests((current) => current.filter((x) => x.id !== request.id));
      if (value === 'accept') {
        await load();
        navigation.navigate('DirectMessage', { userId: request.user.id, name: request.user.name, avatar: request.user.avatar });
      }
    } catch (e) {
      Alert.alert('Unable to update request', (e as Error).message);
    }
  };

  const unreadConversations = conversations.filter((c) => c.unreadCount > 0);
  const readConversations = conversations.filter((c) => c.unreadCount === 0);
  const totalUnread = unreadConversations.length;

  const labels = chatsSubTabs.map((t) => labelFor(t, totalUnread, requests.length));
  const currentLabel = labelFor(subTab, totalUnread, requests.length);

  const emptyText =
    subTab === 'Unread' ? 'You’re all caught up.' : subTab === 'Read' ? 'No conversations yet. Find someone to message.' : 'No pending message requests.';

  return (
    <View style={styles.flex}>
      <View style={styles.subTabsWrap}>
        <SegmentedControl
          options={labels}
          value={currentLabel}
          onChange={(label) => setSubTab(chatsSubTabs[labels.indexOf(label)])}
          variant="pill"
        />
      </View>

      {subTab === 'Requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading…' : emptyText}</Text>}
          renderItem={({ item }) => (
            <RequestRow
              request={item}
              onOpen={() => navigation.navigate('DirectMessage', { userId: item.user.id, name: item.user.name, avatar: item.user.avatar })}
              onAccept={() => action(item, 'accept')}
              onDecline={() => action(item, 'decline')}
              onBlock={() => action(item, 'block')}
            />
          )}
        />
      ) : (
        <FlatList
          data={subTab === 'Unread' ? unreadConversations : readConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>{loading ? 'Loading conversations…' : error ? `Unable to load chats: ${error}` : emptyText}</Text>
              {!loading && subTab !== 'Unread' ? (
                <TouchableOpacity style={styles.discoverBtn} onPress={() => navigation.navigate('DiscoverPeople')}>
                  <Ionicons name="person-add-outline" size={16} color={colors.white} />
                  <Text style={styles.discoverText}>Discover people</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ChatRow
              conversation={item}
              onPress={() => navigation.navigate('DirectMessage', { userId: item.user.id, name: item.user.name, avatar: item.user.avatar })}
              onPressProfile={() => navigation.navigate('UserProfile', { userId: item.user.id, username: item.user.name })}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('DiscoverPeople')}>
        <Ionicons name="create-outline" size={22} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subTabsWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  list: { padding: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  emptyWrap: { alignItems: 'center', gap: spacing.md },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  discoverText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
