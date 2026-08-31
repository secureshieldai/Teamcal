import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeHeader from '../components/HomeHeader';
import GroupUpdatesRow from '../components/GroupUpdatesRow';
import GroupStoryViewer from '../components/GroupStoryViewer';
import TodayProgressCard from '../components/TodayProgressCard';
import StatTilesRow from '../components/StatTilesRow';
import FriendsProgressRow from '../components/FriendsProgressRow';
import CoachChatCard from '../components/CoachChatCard';
import QuickLogRow from '../components/QuickLogRow';
import SectionHeader from '../components/SectionHeader';
import { colors, spacing } from '../theme';
import {
  quickLogItems,
  quickActionItems,
} from '../data/homeData';
import { useHomeSummary } from '../hooks/useHome';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { useApiQuery } from '../hooks/useApiQuery';
import { notificationsService } from '../services/api/notifications.service';
import { groupsService, type GroupStoryGroup } from '../services/api/groups.service';

const GROUP_SEEN_KEY = (groupId: string) => `group-story-seen:${groupId}`;

const QUICK_ACTION_KINDS: Record<string, string> = {
  'log-meal': 'meal',
  'log-supplement': 'supplement',
  'log-mood': 'mood',
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { todayProgress, statTiles, friendsProgress, refetch } = useHomeSummary();
  const notifications = useApiQuery(() => notificationsService.getNotifications(), { success: true, notifications: [], unreadCount: 0 }, []);
  const groupStories = useApiQuery(() => groupsService.getGroupStories(), [] as GroupStoryGroup[], []);
  const [seenAt, setSeenAt] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<GroupStoryGroup | null>(null);

  // useApiQuery already polls every 15s on its own; refetch on focus for an immediate refresh.
  useFocusEffect(useCallback(() => { refetch(); groupStories.refetch(); }, [refetch]));
  useEffect(() => {
    const timer = setInterval(refetch, 15_000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Load each joined group's last-viewed timestamp so the ring can distinguish
  // unseen updates from ones already opened — separate from personal stories.
  useEffect(() => {
    if (!groupStories.data.length) return;
    Promise.all(groupStories.data.map(g => AsyncStorage.getItem(GROUP_SEEN_KEY(g.groupId)).then(v => [g.groupId, v] as const)))
      .then(entries => setSeenAt(Object.fromEntries(entries.filter(([, v]) => v) as [string, string][])));
  }, [groupStories.data]);

  const unseenGroupIds = useMemo(() => {
    const set = new Set<string>();
    groupStories.data.forEach(g => {
      const seen = seenAt[g.groupId];
      if (!seen || new Date(g.latestPostAt).getTime() > new Date(seen).getTime()) set.add(g.groupId);
    });
    return set;
  }, [groupStories.data, seenAt]);

  const openGroupUpdates = (group: GroupStoryGroup) => {
    setActiveGroup(group);
    AsyncStorage.setItem(GROUP_SEEN_KEY(group.groupId), group.latestPostAt);
    setSeenAt(prev => ({ ...prev, [group.groupId]: group.latestPostAt }));
  };

  const currentAvatar=user?.avatar||'';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          avatarUri={currentAvatar}
          hasNotification={notifications.data.unreadCount > 0}
          onPressNotifications={() => navigation.navigate('NotificationsInbox')}
          onPressAvatar={() => navigation.navigate('Profile')}
        />

        <GroupUpdatesRow groups={groupStories.data} unseenGroupIds={unseenGroupIds} onPressGroup={openGroupUpdates} />

        <TodayProgressCard
          calories={todayProgress.calories}
          calorieGoal={todayProgress.calorieGoal}
          percent={todayProgress.percent}
          macros={todayProgress.macros}
          onViewDetails={() => navigation.navigate('Progress')}
        />

        <StatTilesRow tiles={statTiles.map(tile => ({
          ...tile,
          onPress: tile.id === 'steps' ? () => navigation.navigate('Steps')
            : tile.id === 'water' ? () => navigation.navigate('Water')
            : tile.id === 'workouts' ? () => navigation.navigate('Workouts')
            : tile.id === 'fasting' ? () => navigation.navigate('Fasting')
            : undefined,
        }))} />

        <FriendsProgressRow friends={friendsProgress} onSeeAll={() => navigation.navigate('Leaderboards')} />

        <CoachChatCard onOpenChat={() => navigation.navigate('CoachChat')} />

        <View style={styles.quickLogSection}>
          <SectionHeader title="Quick Log" />
          <QuickLogRow
            items={quickLogItems}
            onPressItem={(id) => {
              if (id === 'scan') { navigation.navigate('ScanFood', { mode: 'food' }); return; }
              if (id === 'water') { navigation.navigate('Water'); return; }
              if (id === 'workout') { navigation.navigate('Workouts'); return; }
              if (id === 'weight') { navigation.navigate('Weight'); return; }
            }}
          />
          <QuickLogRow
            items={quickActionItems}
            style={styles.quickActionRow}
            onPressItem={(id) => {
              if (id === 'log-supplement') { navigation.navigate('SupplementTracker'); return; }
              if (id === 'log-mood') { navigation.navigate('MoodJournal'); return; }
              const kind = QUICK_ACTION_KINDS[id];
              if (kind) navigation.navigate('QuickLogEntry', { kind });
            }}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <GroupStoryViewer
        group={activeGroup}
        onClose={() => setActiveGroup(null)}
        onOpenGroup={(groupId) => { setActiveGroup(null); navigation.navigate('PowerSquad', { groupId }); }}
        onViewPost={(groupId) => { setActiveGroup(null); navigation.navigate('PowerSquad', { groupId }); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 8,
  },
  quickLogSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  quickActionRow: {
    marginTop: spacing.lg,
  },
});
