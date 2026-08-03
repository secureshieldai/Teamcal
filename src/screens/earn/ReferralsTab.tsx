import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { referralList, referralProgramDetails, type DateRangeKey } from '../../data/earnData';
import { earnService, type Referral } from '../../services/api/earn.service';
import { useAuth } from '../../context/AuthContext';

const SHARE_CHANNELS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'x', icon: 'logo-twitter', color: '#111111' },
  { key: 'linkedin', icon: 'logo-linkedin', color: '#0A66C2' },
  { key: 'mail', icon: 'mail-outline', color: colors.textSecondary },
];

const copyToClipboard = async (value: string, label: string) => {
  try {
    await (globalThis.navigator as any)?.clipboard?.writeText(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  } catch {
    Share.share({ message: value });
  }
};

export default function ReferralsTab() {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [realReferrals,setRealReferrals]=useState<Referral[]>([]);
  const [loadError,setLoadError]=useState('');
  const {user}=useAuth();
  useEffect(()=>{earnService.getReferrals().then(setRealReferrals).catch(e=>setLoadError((e as Error).message));},[]);
  const realEarnings=useMemo(()=>realReferrals.reduce((sum,item)=>sum+Number(item.reward||0),0),[realReferrals]);
  const converted=realReferrals.filter(item=>item.status==='joined'||item.status==='converted').length;
  const referralCode=user?.referral_code||'';
  const referralLink=`https://teamcal.app/ref/${encodeURIComponent(referralCode)}`;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Referral Overview</Text>
      <Text style={styles.subtitle}>Invite new users and earn rewards when they join and make their first purchase or subscribe.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Total Referrals" value={realReferrals.length.toLocaleString()} icon="people-outline" size="lg" />
        <StatCard label="Total Earnings" value={`$${realEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" size="lg" />
      </View>
      <View style={{ marginTop: spacing.sm }}>
        <StatCard label="Conversion Rate" value={`${realReferrals.length?((converted/realReferrals.length)*100).toFixed(1):'0.0'}%`} icon="trending-up-outline" size="lg" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <View style={styles.inviteCard}>
        <Text style={styles.inviteTitle}>Invite & Earn More</Text>
        <Text style={styles.inviteSubtitle}>Share your link or code and start earning.</Text>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Your Referral Link</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(referralLink, 'Referral link')}>
              <Text style={styles.copyBtnText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Your Referral Code</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{referralCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(referralCode, 'Referral code')}>
              <Text style={styles.copyBtnText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.shareLabel}>Share on</Text>
        <View style={styles.shareRow}>
          {SHARE_CHANNELS.map((channel) => (
            <TouchableOpacity
              key={channel.key}
              style={[styles.shareIcon, { backgroundColor: channel.color }]}
              onPress={() => Share.share({ message: `Join me on TeamCal: ${referralLink}` })}
            >
              <Ionicons name={channel.icon} size={18} color={colors.white} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Referrals</Text>
      <View style={[styles.card, shadow.card]}>
        {loadError?<Text style={styles.refMeta}>Could not load referrals: {loadError}</Text>:null}
        {realReferrals.map((ref,i)=><View key={ref.id} style={[styles.refRow,i===realReferrals.length-1&&{borderBottomWidth:0}]}><View style={{flex:1}}><Text style={styles.refName}>{ref.name}</Text><Text style={styles.refMeta}>Invited {new Date(ref.created_at).toLocaleDateString()}</Text></View><StatusBadge status={ref.status}/></View>)}
        {!loadError&&!realReferrals.length?<Text style={styles.refMeta}>No personal referrals yet. Share your code to invite someone.</Text>:null}
      </View>

      <Text style={styles.sectionTitle}>Showcase Referrals</Text>
      <View style={[styles.card, shadow.card]}>
        {referralList.map((ref, i) => (
          <View key={ref.id} style={[styles.refRow, i === referralList.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.refName}>{ref.name}</Text>
              <Text style={styles.refMeta}>
                Invited {ref.dateInvited}
                {ref.dateJoined ? ` · Joined ${ref.dateJoined}` : ''}
              </Text>
            </View>
            <StatusBadge status={ref.status} />
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Referral Program Details</Text>
      <View style={styles.detailsGrid}>
        {referralProgramDetails.map((detail) => (
          <View key={detail.key} style={[styles.detailCard, shadow.soft]}>
            <View style={styles.detailIcon}>
              <Ionicons name={detail.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.detailTitle}>{detail.title}</Text>
            <Text style={styles.detailDescription}>{detail.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => Alert.alert('Referral Terms', 'Full referral programme rules and eligibility requirements will be available here.')}>
        <Text style={[styles.termsLink, { marginBottom: spacing.xxl }]}>View referral programme terms</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  inviteCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  inviteTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  inviteSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  fieldCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  fieldLabel: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '700' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  fieldValue: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.navy },
  copyBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  shareLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  shareRow: { flexDirection: 'row', gap: spacing.sm },
  shareIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  refName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  refMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailCard: { width: '48%', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  detailDescription: { fontSize: 10.5, color: colors.textSecondary, marginTop: 3, lineHeight: 15 },
  termsLink: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: spacing.xl },
});
