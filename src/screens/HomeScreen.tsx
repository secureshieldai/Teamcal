import React, { useCallback, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeHeader from '../components/HomeHeader';
import StoriesRow from '../components/StoriesRow';
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
import { socialService } from '../services/api/social.service';

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
  const stories = useApiQuery(() => socialService.getStories(), [], []);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  useEffect(() => {
    const timer = setInterval(refetch, 15_000);
    return () => clearInterval(timer);
  }, [refetch]);

  const currentAvatar=user?.avatar||'';
  const storyCards=stories.data.map(item=>({id:item.id,label:item.user?.name||'Creator',avatar:item.user?.avatar||item.image}));

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

        <StoriesRow currentUserAvatar={currentAvatar} stories={storyCards} />

        <TodayProgressCard
          calories={todayProgress.calories}
          calorieGoal={todayProgress.calorieGoal}
          percent={todayProgress.percent}
          macros={todayProgress.macros}
          onViewDetails={() => navigation.navigate('Progress')}
        />

        <StatTilesRow tiles={statTiles} />

        <FriendsProgressRow friends={friendsProgress} onSeeAll={() => navigation.navigate('Leaderboards')} />

        <CoachChatCard
          avatar=""
          name="TeamCal AI Coach"
          online={true}
          verified={true}
          myLastMessage=""
          time=""
          coachReply="Open your private coaching conversation"
          unreadCount={0}
          onOpenChat={() => navigation.navigate('CoachChat')}
        />

        <View style={styles.quickLogSection}>
          <SectionHeader title="Quick Log" />
          <QuickLogRow
            items={quickLogItems}
            onPressItem={(id) => {
              if (id === 'scan') { navigation.navigate('ScanFood', { mode: 'food' }); return; }
              if (id === 'water') { navigation.navigate('Water'); return; }
              if (id === 'workout') { navigation.navigate('Workouts'); return; }
              if (id === 'weight') { navigation.navigate('QuickLogEntry', { kind: 'weight' }); return; }
            }}
          />
          <QuickLogRow
            items={quickActionItems}
            style={styles.quickActionRow}
            onPressItem={(id) => {
              const kind = QUICK_ACTION_KINDS[id];
              if (kind) navigation.navigate('QuickLogEntry', { kind });
            }}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
