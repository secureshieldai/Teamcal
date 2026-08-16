import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import WeightTodayTab from './weight/WeightTodayTab';
import WeightHistoryTab from './weight/WeightHistoryTab';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const TABS = ['Today', 'History'];

export default function WeightScreen() {
  const [tab, setTab] = useState(TABS[0]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Weight Tracker</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} variant="pill" />
      </View>

      {tab === 'History' ? <WeightHistoryTab /> : <WeightTodayTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.navy },
  tabsWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
});
