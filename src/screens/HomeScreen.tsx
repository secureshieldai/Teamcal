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
import { colors } from '../theme';
import {
  currentUser,
  stories,
  coach,
  quickLogItems,
} from '../data/homeData';
import { useHomeSummary } from '../hooks/useHome';
import { useAuth } from '../context/AuthContext';
import type { NoParamRoute, RootStackParamList } from '../navigation/types';
import { useApiQuery } from '../hooks/useApiQuery';
import { notificationsService } from '../services/api/notifications.service';

const QUICK_LOG_DESTINATIONS: Record<string, NoParamRoute> = {
  more: 'Plus',
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { todayProgress, statTiles, friendsProgress, refetch } = useHomeSummary();
  const notifications = useApiQuery(() => notificationsService.getNotifications(), { success: true, notifications: [], unreadCount: 0 }, []);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  useEffect(() => {
    const timer = setInterval(refetch, 15_000);
    return () => clearInterval(timer);
  }, [refetch]);

  const currentUserDisplay = {
    ...currentUser,
    avatar: user?.avatar ?? currentUser.avatar,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader avatarUri={currentUserDisplay.avatar} hasNotification={notifications.data.unreadCount > 0} onPressNotifications={() => navigation.navigate('NotificationsInbox')} />

        <StoriesRow currentUserAvatar={currentUserDisplay.avatar} stories={stories} />

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
          avatar={coach.avatar}
          name={coach.name}
          online={coach.online}
          verified={coach.verified}
          myLastMessage={coach.myLastMessage}
          time={coach.time}
          coachReply={coach.lastMessage.text}
          unreadCount={coach.unreadCount}
          onOpenChat={() => navigation.navigate('CoachChat')}
        />

        <QuickLogRow
          items={quickLogItems}
          onPressItem={(id) => {
            if (id === 'scan') { navigation.navigate('ScanFood', { mode: 'food' }); return; }
            if (['water', 'workout', 'weight'].includes(id)) {
              navigation.navigate('QuickLogEntry', { kind: id });
              return;
            }
            const destination = QUICK_LOG_DESTINATIONS[id];
            if (destination) navigation.navigate(destination as never);
          }}
        />

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
});
