import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import OverviewTab from './earn/OverviewTab';
import BlogsTab from './earn/BlogsTab';
import PDFsTab from './earn/PDFsTab';
import VideosTab from './earn/VideosTab';
import StoresTab from './earn/StoresTab';
import MembershipsTab from './earn/MembershipsTab';
import ReferralsTab from './earn/ReferralsTab';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';

const EARN_TABS = ['Overview', 'Blogs', 'PDFs', 'Videos', 'Stores', 'Memberships', 'Referrals'] as const;
type EarnTab = (typeof EARN_TABS)[number];

export default function EarnScreen() {
  const [tab, setTab] = useState<EarnTab>('Overview');
  const [balance,setBalance]=useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(()=>{earnService.getSummary().then(result=>setBalance(result.summary.balance)).catch(()=>{});},[tab]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Earn with TeamCal</Text>
        </View>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={[...EARN_TABS]} value={tab} onChange={(v) => setTab(v as EarnTab)} variant="pill" />
      </View>

      {tab === 'Overview' && <OverviewTab navigation={navigation} onNavigateTab={setTab} />}
      {tab === 'Blogs' && <BlogsTab navigation={navigation} />}
      {tab === 'PDFs' && <PDFsTab navigation={navigation} />}
      {tab === 'Videos' && <VideosTab navigation={navigation} />}
      {tab === 'Stores' && <StoresTab navigation={navigation} />}
      {tab === 'Memberships' && <MembershipsTab navigation={navigation} />}
      {tab === 'Referrals' && <ReferralsTab />}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    color: colors.navy,
  },
  balanceBox: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
