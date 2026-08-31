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
import { useProfile } from '../hooks/useProfile';
import type { RootStackParamList } from '../navigation/types';

// Marketplace removed from profile menu (item G)
const profileMenuItems = [
  { id: 'progress',      icon: 'trending-up-outline' as const,       label: 'My Progress' },
  { id: 'measurements',  icon: 'resize-outline' as const,             label: 'My Measurements' },
  { id: 'photos',        icon: 'images-outline' as const,             label: 'Progress Photos' },
  { id: 'achievements',  icon: 'ribbon-outline' as const,             label: 'My Achievements' },
  { id: 'rewards',       icon: 'gift-outline' as const,               label: 'Rewards' },
  { id: 'invite',        icon: 'person-add-outline' as const,         label: 'Invite Friends' },
  { id: 'settings',      icon: 'settings-outline' as const,           label: 'Settings' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profileUser, profileStats, weekStats } = useProfile();

  const handleMenuItem = (id: string) => {
    switch (id) {
      case 'progress':     return navigation.navigate('Progress');
      case 'measurements': return navigation.navigate('ProfileCollection', { kind: 'measurements' });
      case 'photos':       return navigation.navigate('ProfileCollection', { kind: 'photos' });
      case 'achievements': return navigation.navigate('ProfileCollection', { kind: 'achievements' });
      case 'rewards':      return navigation.navigate('Rewards');
      case 'invite':       return navigation.navigate('InviteFriends');
      case 'settings':     return navigation.navigate('Settings');
    }
  };

  return (
    // edges includes 'bottom' to fix Settings row being cut off (item J)
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* A: bio shown, B: proper level display */}
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
          <MenuListCard items={profileMenuItems} onPressItem={handleMenuItem} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pageTitle: { ...typography.h1, color: colors.navy },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  thisWeekHeader: { marginTop: spacing.xl },
  weekRow: { flexDirection: 'row', gap: spacing.sm },
});
