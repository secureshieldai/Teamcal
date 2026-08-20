import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import FastingNowTab from './fasting/FastingNowTab';
import FastingHistoryTab from './fasting/FastingHistoryTab';
import FastingAnalyticsTab from './fasting/FastingAnalyticsTab';
import FastingAITab from './fasting/FastingAITab';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const TABS = ['Now', 'History', 'Analytics', 'AI'];

export default function FastingScreen() {
  const [tab, setTab] = useState(TABS[0]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Fasting Tracker</Text>
          <Text style={styles.subtitle}>Track fasts & metabolic stages</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} variant="pill" />
      </View>

      {tab === 'History' ? (
        <FastingHistoryTab />
      ) : tab === 'Analytics' ? (
        <FastingAnalyticsTab />
      ) : tab === 'AI' ? (
        <FastingAITab />
      ) : (
        <FastingNowTab navigation={navigation} />
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
});
