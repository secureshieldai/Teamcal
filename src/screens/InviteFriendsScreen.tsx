import React from 'react';
import { Alert, Clipboard, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, shadow, spacing } from '../theme';
import { useInvite } from '../hooks/useProfile';
import { useApiQuery } from '../hooks/useApiQuery';
import { earnService } from '../services/api/earn.service';

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  joined: 'Signed up',
  converted: 'Qualified ✓',
};

export default function InviteFriendsScreen() {
  const navigation = useNavigation();
  const { inviteCode, referralLink } = useInvite();
  const referrals = useApiQuery(() => earnService.getReferrals(), [], []);

  const shareMessage = `Join me on TeamCal — the social health & fitness app!\n\nUse my referral link: ${referralLink}\nOr invite code: ${inviteCode}`;

  const copyCode = async () => {
    Clipboard.setString(inviteCode);
    Alert.alert('Copied', 'Invite code copied to clipboard.');
  };
  const copyLink = async () => {
    Clipboard.setString(referralLink);
    Alert.alert('Copied', 'Referral link copied to clipboard.');
  };
  const shareCode = () => Share.share({ message: shareMessage, url: referralLink });
  const shareLink = () => Share.share({ message: shareMessage, url: referralLink });

  const pending = referrals.data.filter((r) => r.status === 'invited' || r.status === 'joined');
  const qualified = referrals.data.filter((r) => r.status === 'converted');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Invite Friends</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>
          Stronger <Text style={{ color: colors.primary }}>Together!</Text>
        </Text>
        <Text style={styles.subtitle}>Invite friends and earn rewards when they join and stay active.</Text>

        {/* Invite Code card */}
        <View style={[styles.codeCard, shadow.card]}>
          <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{inviteCode || '------'}</Text>
            <TouchableOpacity onPress={copyCode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareCode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Referral Link card */}
        <View style={[styles.codeCard, shadow.card]}>
          <Text style={styles.codeLabel}>YOUR REFERRAL LINK</Text>
          <View style={styles.codeRow}>
            <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
            <TouchableOpacity onPress={copyLink} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareLink} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* How referrals work */}
        <View style={[styles.howCard, shadow.soft]}>
          <Text style={styles.howTitle}>How Referrals Work</Text>
          {[
            { step: '1', text: 'Share your link or invite code with a friend.' },
            { step: '2', text: 'They sign up using your link or enter your code at registration.' },
            { step: '3', text: 'Your friend completes onboarding and remains active for at least 7 days.' },
            { step: '4', text: 'Once qualified, you both earn 150 reward points.' },
          ].map((item) => (
            <View key={item.step} style={styles.howRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>{item.step}</Text></View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
          <View style={styles.qualifyBox}>
            <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.qualifyText}>
              A referral qualifies only after the invited user completes onboarding and stays active for at least 7 days. Rewards are issued after qualification.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Sent" value={referrals.data.length} />
          <StatBox label="Pending" value={pending.length} />
          <StatBox label="Qualified" value={qualified.length} />
          <StatBox label="Points earned" value={qualified.length * 150} />
        </View>

        {/* Referral history */}
        {referrals.data.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>REFERRAL HISTORY</Text>
            <View style={[styles.listCard, shadow.soft]}>
              {referrals.data.map((r, i) => (
                <View key={r.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person-outline" size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{r.name || 'Invited friend'}</Text>
                    <Text style={styles.rowSub}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, r.status === 'converted' && styles.statusBadgeDone]}>
                    <Text style={[styles.statusText, r.status === 'converted' && { color: colors.success }]}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Text>
                  </View>
                  {r.status === 'converted' && <Text style={styles.rewardText}>+150 pts</Text>}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  pageTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  headline: { fontSize: 22, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  codeCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  codeLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  codeText: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.navy, letterSpacing: 3 },
  linkText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
  howCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  howTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNum: { fontSize: 12, fontWeight: '800', color: colors.white },
  howText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  qualifyBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FFF5EE', borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm, alignItems: 'flex-start' },
  qualifyText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  listCard: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF5EE', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  statusBadge: { backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeDone: { backgroundColor: '#E8FBF1' },
  statusText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary },
  rewardText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
