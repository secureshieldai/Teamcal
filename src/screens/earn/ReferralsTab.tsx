import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { referralProgramDetails, type DateRangeKey } from '../../data/earnData';
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
  const [termsOpen,setTermsOpen]=useState(false);
  const {user}=useAuth();
  useFocusEffect(useCallback(()=>{let active=true;const load=()=>earnService.getReferrals().then(rows=>{if(active){setRealReferrals(rows);setLoadError('')}}).catch(e=>active&&setLoadError((e as Error).message));load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer)};},[]));
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

      <TouchableOpacity onPress={() => setTermsOpen(true)}>
        <Text style={[styles.termsLink, { marginBottom: spacing.xxl }]}>View referral programme terms</Text>
      </TouchableOpacity>

      <ReferralTermsModal visible={termsOpen} onClose={()=>setTermsOpen(false)}/>
    </ScrollView>
  );
}

const TERM_SECTIONS=[
  {title:'1. Eligibility',body:'To participate in the TeamCal Referral Programme and earn referral commissions, you must maintain an active and eligible TeamCal account and comply with these Referral Programme Terms and any other applicable TeamCal terms and policies.'},
  {title:'2. Referral Commission',body:'Eligible participants may earn a referral commission equal to 10% of qualifying subscription payments successfully received by TeamCal from customers they have successfully referred through the official TeamCal referral system.'},
  {title:'3. Five-Year Commission Period',body:'For each eligible referred customer, referral commissions may be earned on qualifying subscription payments for a maximum period of five (5) years, beginning from the date the referred customer first becomes a paying subscriber.\n\nThe five-year period does not restart if the referred customer changes subscription plans, upgrades, downgrades, cancels and later resubscribes, or otherwise changes their subscription, unless TeamCal expressly determines otherwise.'},
  {title:'4. Subscription Prices and Plans',body:'TeamCal’s subscription plans, prices, features, billing periods and other subscription terms may be changed, updated, introduced or discontinued from time to time, subject to applicable law.\n\nReferral commissions are calculated based on the qualifying subscription amount actually paid and successfully received by TeamCal, rather than any previous or advertised subscription price.\n\nParticipants are responsible for checking the TeamCal app or other official TeamCal channels regularly to remain informed about the current subscription plans, prices and applicable Referral Programme terms.'},
  {title:'5. Pending Commission Period',body:'Referral commissions will initially be recorded as Pending.\n\nA qualifying commission becomes available for payout 30 days after the applicable subscription payment is successfully received, provided the transaction remains valid and has not been refunded, reversed, disputed, charged back, cancelled or otherwise invalidated.'},
  {title:'6. Refunds, Reversals and Chargebacks',body:'Referral commissions are not payable on transactions that are refunded, reversed, charged back, fraudulent, disputed or otherwise invalid.\n\nWhere a commission relating to such a transaction has already been credited or paid, TeamCal may, where permitted by applicable law, deduct or offset the corresponding amount against pending or future referral earnings.'},
  {title:'7. Referral Attribution',body:'A referral must be properly recorded and attributed through TeamCal’s official referral system to qualify for commission.\n\nTeamCal’s referral tracking records will be used to determine attribution, subject to correction where there is a verified technical error.'},
  {title:'8. Self-Referrals and Prohibited Activity',body:'Participants must not abuse or manipulate the Referral Programme. Prohibited activities include fraudulent referrals, fake or duplicate accounts, unauthorized spam, misleading advertising, artificial transactions, manipulation of referral tracking, self-referrals where prohibited, or any attempt to improperly generate commissions.\n\nTeamCal may investigate suspicious referral activity and withhold affected commissions while an investigation is reasonably conducted.'},
  {title:'9. Payouts',body:'Only commissions marked as Available for Payout may be withdrawn.\n\nPayouts may be subject to applicable minimum payout requirements, account or identity verification, payment-provider requirements, supported payout methods and applicable laws or regulations.'},
  {title:'10. Taxes',body:'Participants are responsible for determining and satisfying any tax obligations associated with referral commissions they receive, except where TeamCal is required by law to calculate, report, deduct or withhold taxes.'},
  {title:'11. No Guaranteed Earnings',body:'Participation in the Referral Programme does not guarantee earnings or any particular level of income. Referral earnings depend on eligible referrals making qualifying subscription payments and satisfying the requirements of the programme.'},
  {title:'12. Programme Changes',body:'TeamCal may modify, update, suspend or discontinue the Referral Programme, including its commission rates, eligibility requirements, payout rules, attribution rules and other programme conditions, subject to applicable law.\n\nWhere appropriate, material changes will be communicated through the TeamCal app or another official TeamCal communication channel. Participants should regularly review the current Referral Programme Terms.'},
  {title:'13. Suspension or Termination',body:'TeamCal may suspend or remove a participant from the Referral Programme for fraud, abuse, manipulation, material violations of these Terms or other conduct that threatens the integrity of the programme.\n\nThe treatment of pending or unpaid commissions following suspension or termination will be determined in accordance with these Terms and applicable law.'},
  {title:'14. Programme Administration',body:'TeamCal may make reasonable determinations concerning referral attribution, qualifying transactions, commission calculations, suspected abuse and programme eligibility based on its records and the operation of its referral system, subject to applicable law and correction of verified errors.'},
  {title:'15. Acceptance of Terms',body:'By participating in the TeamCal Referral Programme, you acknowledge that you have read, understood and agreed to these Referral Programme Terms, together with any other TeamCal terms and policies that apply to your use of the platform.'},
];

function ReferralTermsModal({visible,onClose}:{visible:boolean;onClose:()=>void}){
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
    <SafeAreaView style={styles.termsSafe} edges={['top','bottom']}>
      <View style={styles.termsHeader}><TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}><Ionicons name="close" size={24} color={colors.textPrimary}/></TouchableOpacity><Text style={styles.termsTitle}>Referral Programme Terms</Text><View style={{width:24}}/></View>
      <ScrollView contentContainerStyle={styles.termsContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.termsUpdated}>Effective date: 16 August 2026</Text>
        <Text style={styles.termsIntro}>Please read these terms before participating in the TeamCal Referral Programme. By sharing a referral link or code, you agree to these terms.</Text>
        {TERM_SECTIONS.map(section=><View key={section.title} style={styles.termSection}><Text style={styles.termHeading}>{section.title}</Text><Text style={styles.termBody}>{section.body}</Text></View>)}
        <Text style={styles.termsContact}>Questions about referral eligibility or commission activity can be submitted through Help & Support.</Text>
        <TouchableOpacity style={styles.termsDone} onPress={onClose}><Text style={styles.termsDoneText}>Done</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
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
  termsSafe:{flex:1,backgroundColor:colors.background},
  termsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.lg,paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border,backgroundColor:colors.card},
  termsTitle:{...typography.h2,color:colors.textPrimary},
  termsContent:{padding:spacing.lg,paddingBottom:spacing.xxl},
  termsUpdated:{fontSize:11,color:colors.textMuted,fontWeight:'600'},
  termsIntro:{fontSize:13,color:colors.textSecondary,lineHeight:20,marginTop:spacing.md,marginBottom:spacing.sm},
  termSection:{marginTop:spacing.lg},
  termHeading:{fontSize:14,fontWeight:'800',color:colors.textPrimary},
  termBody:{fontSize:12.5,color:colors.textSecondary,lineHeight:19,marginTop:5},
  termsContact:{fontSize:12.5,color:colors.textSecondary,lineHeight:19,marginTop:spacing.xl,padding:spacing.md,backgroundColor:colors.card,borderRadius:radii.lg},
  termsDone:{backgroundColor:colors.primary,borderRadius:radii.pill,alignItems:'center',paddingVertical:spacing.md,marginTop:spacing.xl},
  termsDoneText:{color:colors.white,fontSize:14,fontWeight:'800'},
});
