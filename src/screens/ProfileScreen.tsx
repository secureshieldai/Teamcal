import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProfileHeaderCard from '../components/ProfileHeaderCard';
import ProfileStatsRow from '../components/ProfileStatsRow';
import SectionHeader from '../components/SectionHeader';
import WeekStatCard from '../components/WeekStatCard';
import MenuListCard from '../components/MenuListCard';
import { colors, spacing, typography } from '../theme';
import { profileMenuItems } from '../data/profileData';
import { useProfile } from '../hooks/useProfile';
import type { NoParamRoute, RootStackParamList } from '../navigation/types';

const MENU_DESTINATIONS: Record<string, NoParamRoute> = {
  progress: 'Progress',
  marketplace: 'Marketplace',
  rewards: 'Rewards',
  invite: 'InviteFriends',
  settings: 'Settings',
};

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profileUser, profileStats, weekStats } = useProfile();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeaderCard {...profileUser} />

        <View style={styles.divider} />

        <ProfileStatsRow stats={profileStats} />

        <SectionHeader title="This Week" style={styles.thisWeekHeader} />
        <View style={styles.weekRow}>
          {weekStats.map((stat) => (
            <WeekStatCard key={stat.label} {...stat} />
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <MenuListCard
            items={profileMenuItems}
            onPressItem={(id) => {
              if (['measurements', 'photos', 'achievements'].includes(id)) { navigation.navigate('ProfileCollection', { kind: id as 'measurements' | 'photos' | 'achievements' }); return; }
              const destination = MENU_DESTINATIONS[id];
              if (destination) navigation.navigate(destination as never);
            }}
          />
        </View>
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
    ...typography.h1,
    color: colors.navy,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  thisWeekHeader: {
    marginTop: spacing.xl,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
