import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import SegmentedControl from '../../components/SegmentedControl';
import DonutChart from '../../components/charts/DonutChart';
import MiniLineChart from '../../components/charts/MiniLineChart';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import {
  earnSummary,
  earningsBySource,
  earningsTrend,
  topPerformingContent,
  recentTransactions,
  withdrawalHistory,
  withdrawSettings,
  earnQuickActions,
  type DateRangeKey,
  type TopContentType,
} from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { earnService, type StripePayout } from '../../services/api/earn.service';

type EarnTab = 'Overview' | 'Blogs' | 'PDFs' | 'Videos' | 'Stores' | 'Memberships' | 'Referrals';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onNavigateTab: (tab: EarnTab) => void;
};

const TRANSACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Blog Earnings': 'document-text-outline',
  'PDF Purchase': 'book-outline',
  'Video Purchase': 'videocam-outline',
  'Store Order': 'bag-outline',
  'Membership Payment': 'ribbon-outline',
  'Referral Commission': 'people-outline',
  Withdrawal: 'arrow-down-circle-outline',
};

const CONTENT_FILTERS: ('All' | TopContentType)[] = ['All', 'Blog', 'PDF', 'Video', 'Product', 'Membership'];

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function OverviewTab({ navigation, onNavigateTab }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [metric, setMetric] = useState<keyof typeof earningsTrend.metrics>('Earnings');
  const [contentFilter, setContentFilter] = useState<'All' | TopContentType>('All');
  const [stripePayout,setStripePayout]=useState<StripePayout|null>(null);
  const [withdrawAmount,setWithdrawAmount]=useState('');
  const [payoutBusy,setPayoutBusy]=useState(false);
  const refreshPayout=()=>earnService.payoutStatus().then(x=>setStripePayout(x.payout)).catch(()=>{});
  useEffect(()=>{refreshPayout();},[]);
  const connectStripe=async()=>{try{setPayoutBusy(true);if(stripePayout?.connected){await Linking.openURL(await earnService.payoutLoginLink());}else{const result=await earnService.connectStripe();await Linking.openURL(result.onboardingUrl);}}catch(error){Alert.alert('Unable to open Stripe',(error as Error).message);}finally{setPayoutBusy(false);}};
  const withdraw=async()=>{const amount=Number(withdrawAmount);if(!amount)return;try{setPayoutBusy(true);await earnService.withdraw(amount);setWithdrawAmount('');await refreshPayout();Alert.alert('Withdrawal requested','Stripe is processing your payout.');}catch(error){Alert.alert('Unable to withdraw',(error as Error).message);}finally{setPayoutBusy(false);}};

  const totalSource = useMemo(() => earningsBySource.reduce((s, e) => s + e.value, 0), []);
  const filteredContent = useMemo(
    () => (contentFilter === 'All' ? topPerformingContent : topPerformingContent.filter((c) => c.type === contentFilter)),
    [contentFilter]
  );

  const handleQuickAction = (key: string) => {
    if (key === 'audience-engine') navigation.navigate('AudienceEngine', undefined);
    else if (key === 'create-blog') navigation.navigate('CreateBlog');
    else if (key === 'upload-pdf') onNavigateTab('PDFs');
    else if (key === 'upload-video') onNavigateTab('Videos');
    else if (key === 'create-store') onNavigateTab('Stores');
    else if (key === 'create-membership') onNavigateTab('Memberships');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <StatCard label="Lifetime Earnings" value={`$${earnSummary.lifetimeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="trending-up-outline" size="lg" />
        <StatCard label="Last 30 Days" value={`$${earnSummary.last30Days.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="calendar-outline" size="lg" />
      </View>
      <View style={styles.statsRowSm}>
        <StatCard label="Available Balance" value={`$${earnSummary.availableBalance.toFixed(2)}`} icon="wallet-outline" />
        <StatCard label="Pending Earnings" value={`$${earnSummary.pendingEarnings.toFixed(2)}`} icon="time-outline" />
        <StatCard label="Total Withdrawn" value={`$${earnSummary.totalWithdrawn.toLocaleString()}`} icon="business-outline" />
      </View>

      <View style={styles.dateRow}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
        {earnQuickActions.map((action) => (
          <TouchableOpacity key={action.key} style={styles.quickAction} onPress={() => handleQuickAction(action.key)} activeOpacity={0.8}>
            <View style={styles.quickActionIcon}>
              <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Earnings by Source</Text>
        </View>
        <View style={styles.sourceRow}>
          <DonutChart segments={earningsBySource.map((s) => ({ value: s.value, color: s.color }))} size={100} strokeWidth={16} />
          <View style={styles.legend}>
            {earningsBySource.map((source) => (
              <View key={source.key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: source.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {source.label}
                </Text>
                <Text style={styles.legendValue}>{((source.value / totalSource) * 100).toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.card, shadow.card, { marginTop: spacing.lg }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Earnings Analytics</Text>
        </View>
        <View style={styles.metricRow}>
          <SegmentedControl
            options={Object.keys(earningsTrend.metrics)}
            value={metric}
            onChange={(v) => setMetric(v as keyof typeof earningsTrend.metrics)}
            variant="pill"
          />
        </View>
        <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <MiniLineChart values={earningsTrend.metrics[metric]} labels={earningsTrend.labels} width={280} />
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Top-Performing Content</Text>
        <TouchableOpacity onPress={() => comingSoon('Full analytics')}>
          <Text style={styles.seeAll}>See all analytics</Text>
        </TouchableOpacity>
      </View>
      <SegmentedControl options={CONTENT_FILTERS} value={contentFilter} onChange={(v) => setContentFilter(v as typeof contentFilter)} variant="pill" />
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        {filteredContent.map((item) => (
          <View key={item.id} style={[styles.contentCard, shadow.soft]}>
            <View style={styles.contentThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contentTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.contentMeta}>
                {item.type} · {item.views.toLocaleString()} views · {item.sales} sales
              </Text>
              <Text style={styles.contentEarned}>${item.earned.toFixed(2)} earned</Text>
              <View style={styles.contentActions}>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => comingSoon('Analytics')}>
                  <Text style={styles.ghostBtnText}>View Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => comingSoon('Promote again')}>
                  <Text style={styles.ghostBtnText}>Promote Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => comingSoon('Full transaction history')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, shadow.card]}>
        {recentTransactions.map((tx, i) => (
          <View key={tx.id} style={[styles.txRow, i === recentTransactions.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.txIcon}>
              <Ionicons name={TRANSACTION_ICONS[tx.type] ?? 'cash-outline'} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle} numberOfLines={1}>
                {tx.title}
              </Text>
              <Text style={styles.txMeta} numberOfLines={1}>
                {tx.source} · {tx.date}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.txAmount}>+${tx.amount.toFixed(2)}</Text>
              <StatusBadge status={tx.status} />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Payout Method</Text>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.payoutRow}>
          <View style={styles.stripeIcon}>
            <Ionicons name="card-outline" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutTitle}>Stripe</Text>
            <Text style={styles.payoutMeta}>{stripePayout?.stripe_account_status || 'Not connected'}</Text>
          </View>
          <StatusBadge status={stripePayout?.connected ? 'Active' : 'Draft'} />
        </View>
        <Text style={styles.payoutExplain}>
          Connect Stripe to receive your earnings directly to your bank account.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={connectStripe} disabled={payoutBusy} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{stripePayout?.connected?'Open Stripe Dashboard':'Connect Stripe Account'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Withdraw Earnings</Text>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.withdrawStatRow}>
          <Text style={styles.withdrawLabel}>Available to withdraw</Text>
          <Text style={styles.withdrawValue}>${earnSummary.availableBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.withdrawStatRow}>
          <Text style={styles.withdrawLabel}>Pending balance</Text>
          <Text style={styles.withdrawValueMuted}>${earnSummary.pendingEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.withdrawStatRow}>
          <Text style={styles.withdrawLabel}>Minimum withdrawal</Text>
          <Text style={styles.withdrawValueMuted}>${withdrawSettings.minimumWithdrawal.toFixed(2)}</Text>
        </View>
        <TextInput
          style={styles.amountInput}
          placeholder="Withdrawal amount (USD)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          editable={Boolean(stripePayout?.stripe_payouts_enabled)}
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
        />
        <TouchableOpacity style={[styles.primaryBtn, !stripePayout?.stripe_payouts_enabled && styles.primaryBtnDisabled]} disabled={!stripePayout?.stripe_payouts_enabled||payoutBusy} onPress={withdraw} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Withdraw</Text>
        </TouchableOpacity>
        <Text style={styles.disabledHint}>{stripePayout?.stripe_payouts_enabled?'Payouts are processed securely by Stripe.':'Connect your Stripe payout account before withdrawing.'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Withdrawal History</Text>
      <View style={[styles.card, shadow.card, { marginBottom: spacing.xxl }]}>
        {withdrawalHistory.map((wd, i) => (
          <View key={wd.id} style={[styles.txRow, i === withdrawalHistory.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>${wd.amount.toFixed(2)}</Text>
              <Text style={styles.txMeta}>
                {wd.date} · {wd.method}
              </Text>
            </View>
            <StatusBadge status={wd.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsRowSm: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dateRow: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  quickActionsRow: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  quickAction: {
    alignItems: 'center',
    width: 78,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 11.5,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  metricRow: {
    marginTop: spacing.sm,
  },
  contentCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  contentThumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  contentTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contentMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contentEarned: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    marginTop: 2,
  },
  contentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  ghostBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 4,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stripeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  payoutMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payoutExplain: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 17,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.ringTrack,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13.5,
  },
  withdrawStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  withdrawLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  withdrawValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  withdrawValueMuted: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  amountInput: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  disabledHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
