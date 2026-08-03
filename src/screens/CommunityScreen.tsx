import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import SocialFeedTab from './social/SocialFeedTab';
import SocialChatsTab from './social/SocialChatsTab';
import SocialCommunitiesTab from './social/SocialCommunitiesTab';
import SocialMeTab from './social/SocialMeTab';
import { colors, spacing, typography } from '../theme';
import { socialTopTabs } from '../data/communityData';
import type { RootStackParamList } from '../navigation/types';

export default function CommunityScreen() {
  const [tab, setTab] = useState(socialTopTabs[0]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.pageTitle}>Come have fun</Text>
          <Text style={styles.pageSubtitle}>Community, chats & stories</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('GlobalSearch')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Challenges')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Leaderboards')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ribbon-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={socialTopTabs} value={tab} onChange={setTab} variant="pill" />
      </View>

      {tab === 'Chats' ? (
        <SocialChatsTab navigation={navigation} />
      ) : tab === 'Communities' ? (
        <SocialCommunitiesTab navigation={navigation} />
      ) : tab === 'Me' ? (
        <SocialMeTab navigation={navigation} />
      ) : (
        <SocialFeedTab navigation={navigation} />
      )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.navy,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
});
