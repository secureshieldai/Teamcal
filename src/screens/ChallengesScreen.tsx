import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import MyChallengesTab from './challenges/MyChallengesTab';
import FindChallengesTab from './challenges/FindChallengesTab';
import PastChallengesTab from './challenges/PastChallengesTab';
import { colors, spacing, typography } from '../theme';
import { challengeTabs } from '../data/challengesData';
import type { RootStackParamList } from '../navigation/types';

export default function ChallengesScreen() {
  const [tab, setTab] = useState(challengeTabs[0]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Challenges</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming soon', "Advanced filters aren't available yet.")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={challengeTabs} value={tab} onChange={setTab} variant="pill" />
      </View>

      {tab === 'My Challenges' && <MyChallengesTab navigation={navigation} />}
      {tab === 'Find Challenges' && <FindChallengesTab navigation={navigation} />}
      {tab === 'Past Challenges' && <PastChallengesTab navigation={navigation} />}
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
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
