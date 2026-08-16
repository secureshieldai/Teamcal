import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import DonutChart from '../../components/charts/DonutChart';
import MiniLineChart from '../../components/charts/MiniLineChart';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import {
  earningsBySource,
  withdrawSettings,
  earnQuickActions,
  type DateRangeKey,
} from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { earnService, type EarnSummary, type StripePayout } from '../../services/api/earn.service';
import type { EarnEntry } from '../../types/api';

type EarnTab = 'Overview' | 'Blogs' | 'PDFs' | 'Videos' | 'Stores' | 'Memberships' | 'Referrals';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onNavigateTab: (tab: EarnTab) => void;
};

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function OverviewTab({ navigation, onNavigateTab }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [stripePayout,setStripePayout]=useState<StripePayout|null>(null);
  const [withdrawAmount,setWithdrawAmount]=useState('');
  const [payoutBusy,setPayoutBusy]=useState(false);
  const [summary,setSummary]=useState<EarnSummary>({balance:0,lifetimeEarnings:0,periodEarnings:0,range:'30d',last30Days:0,availableBalance:0,pendingEarnings:0,totalWithdrawn:0,sourceTotals:{},counts:{assets:0,blogs:0,products:0,referrals:0}});
  const [entries,setEntries]=useState<EarnEntry[]>([]);
  const [loadError,setLoadError]=useState('');
  const refreshPayout=useCallback(()=>earnService.payoutStatus().then(x=>{setStripePayout(x.payout);setLoadError('');}).catch(e=>setLoadError((e as Error).message)),[]);
  const refreshSummary=useCallback(()=>earnService.getSummary(range==='custom'?'lifetime':range).then(x=>{setSummary(x.summary);setEntries(x.entries);setStripePayout(x.payout);setLoadError('');}).catch(e=>setLoadError((e as Error).message)),[range]);
  useFocusEffect(useCallback(()=>{refreshSummary();refreshPayout();const timer=setInterval(()=>{refreshSummary();refreshPayout()},15000);return()=>clearInterval(timer);},[refreshPayout,refreshSummary]));
  const connectStripe=async()=>{try{setPayoutBusy(true);if(stripePayout?.connected){await Linking.openURL(await earnService.payoutLoginLink());}else{const result=await earnService.connectStripe();await Linking.openURL(result.onboardingUrl);}}catch(error){Alert.alert('Unable to open Stripe',(error as Error).message);}finally{setPayoutBusy(false);}};
  const withdraw=async()=>{const amount=Number(withdrawAmount);if(!amount)return;try{setPayoutBusy(true);await earnService.withdraw(amount);setWithdrawAmount('');await refreshPayout();Alert.alert('Withdrawal requested','Stripe is processing your payout.');}catch(error){Alert.alert('Unable to withdraw',(error as Error).message);}finally{setPayoutBusy(false);}};

  const personalSources=useMemo(()=>earningsBySource.map(source=>({...source,value:Number(summary.sourceTotals[source.key]||0)})),[summary.sourceTotals]);
  const totalSource = useMemo(() => Math.max(1,personalSources.reduce((s, e) => s + e.value, 0)), [personalSources]);
  const trend=useMemo(()=>{const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});return{labels:days.map(d=>d.toLocaleDateString(undefined,{weekday:'short'})),values:days.map(d=>entries.filter(e=>new Date(e.created_at).toDateString()===d.toDateString()).reduce((n,e)=>n+Number(e.amount||0),0))}},[entries]);

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
        <StatCard label="Earnings" value={`$${summary.periodEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="trending-up-outline" size="lg" />
        <StatCard label="Available Balance" value={`$${summary.availableBalance.toFixed(2)}`} icon="wallet-outline" size="lg" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Pending Earnings" value={`$${summary.pendingEarnings.toFixed(2)}`} icon="time-outline" size="lg" />
        <StatCard label="Total Withdrawn" value={`$${summary.totalWithdrawn.toLocaleString(undefined,{minimumFractionDigits:2})}`} icon="business-outline" size="lg" />
      </View>
      {loadError?<Text style={styles.disabledHint}>Could not load personal earnings: {loadError}</Text>:null}

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
          <DonutChart segments={personalSources.map((s) => ({ value: s.value, color: s.color }))} size={100} strokeWidth={16} />
          <View style={styles.legend}>
            {personalSources.map((source) => (
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
        <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <MiniLineChart values={trend.values} labels={trend.labels} width={280} />
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your Reward Activity</Text>
        <TouchableOpacity onPress={() => comingSoon('Full transaction history')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, shadow.card]}>
        {entries.map((entry,i)=><View key={entry.id} style={[styles.txRow,i===entries.length-1&&{borderBottomWidth:0}]}><View style={styles.txIcon}><Ionicons name="gift-outline" size={16} color={colors.primary}/></View><View style={{flex:1}}><Text style={styles.txTitle}>{entry.label}</Text><Text style={styles.txMeta}>{entry.source} · {new Date(entry.created_at).toLocaleString()}</Text></View><Text style={styles.txAmount}>+{entry.amount} pts</Text></View>)}
        {!entries.length?<Text style={styles.txMeta}>No personal reward activity yet.</Text>:null}
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
          <Text style={styles.withdrawValue}>${summary.availableBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.withdrawStatRow}>
          <Text style={styles.withdrawLabel}>Pending balance</Text>
          <Text style={styles.withdrawValueMuted}>${summary.pendingEarnings.toFixed(2)}</Text>
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
        {((stripePayout?.history as {id:string;amount:number;createdAt:string;status:string}[]|undefined)||[]).map((wd, i, list) => (
          <View key={wd.id} style={[styles.txRow, i === list.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>${wd.amount.toFixed(2)}</Text>
              <Text style={styles.txMeta}>
                {new Date(wd.createdAt).toLocaleString()} · Stripe
              </Text>
            </View>
            <StatusBadge status={wd.status} />
          </View>
        ))}
        {!((stripePayout?.history as unknown[]|undefined)||[]).length?<Text style={styles.txMeta}>No personal withdrawals yet.</Text>:null}
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
    marginBottom: spacing.sm,
  },
  statsRowSm: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
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
