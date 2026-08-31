import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import SegmentedControl from '../components/SegmentedControl';
import LeaderboardHighlightCard from '../components/LeaderboardHighlightCard';
import LeaderboardRow from '../components/LeaderboardRow';
import YourRankCard from '../components/YourRankCard';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { leaderboardTabs } from '../data/leaderboardsData';
import { useLeaderboard } from '../hooks/useLeaderboards';

export default function LeaderboardsScreen() {
  const [tab, setTab] = useState(leaderboardTabs[2]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const type = tab === 'Global' ? 'global' : tab === 'Friends' ? 'friends' : 'teams';
  const { entries: leaderboardEntries, yourRank, highlightTeam, loading } = useLeaderboard(type);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Leaderboards</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={leaderboardTabs} value={tab} onChange={setTab} variant="pill" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {highlightTeam && <LeaderboardHighlightCard {...highlightTeam} />}

        <View style={[styles.listCard, shadow.card]}>
          {leaderboardEntries.map((entry) => (
            <LeaderboardRow
              key={entry.rank}
              rank={entry.rank}
              name={entry.name}
              avatar={entry.avatar}
              points={entry.points}
              highlighted={entry.highlighted}
              onPress={entry.isTeam ? undefined : () => navigation.navigate('UserProfile', { userId: entry.id, username: entry.name })}
            />
          ))}
        </View>
        {!loading && !leaderboardEntries.length && <Text style={styles.empty}>No rankings are available yet.</Text>}
        {yourRank && <YourRankCard {...yourRank} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tabsWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.sm,
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginVertical: spacing.xl },
});
