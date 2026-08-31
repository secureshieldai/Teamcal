import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelFeed'>;

export default function ChannelEarningsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    available: 0,
    withdrawn: 0,
    impressions: 0,
    revenue: 0,
    creatorShare: 40,
    withdrawals: [] as any[],
  });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const data = await channelsService.getEarnings(channelId);
      setEarnings(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    if (earnings.available < 50) {
      Alert.alert('Minimum Payout', 'Minimum withdrawal amount is $50');
      return;
    }

    Alert.alert(
      'Request Withdrawal',
      `Withdraw $${earnings.available.toFixed(2)} to your linked payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          onPress: async () => {
            setWithdrawing(true);
            try {
              await channelsService.requestWithdrawal(channelId, earnings.available);
              Alert.alert('Success', 'Withdrawal request submitted successfully');
              loadEarnings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to request withdrawal');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.balanceCard, shadow.soft]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>${earnings.available.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.withdrawBtn, (earnings.available < 50 || withdrawing) && styles.btnDisabled]}
            onPress={handleWithdraw}
            disabled={earnings.available < 50 || withdrawing}
          >
            {withdrawing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.minText}>Minimum withdrawal: $50</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.statCard, shadow.soft]}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>${earnings.total.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, shadow.soft]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>${earnings.pending.toFixed(2)}</Text>
          </View>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <Text style={styles.cardTitle}>Revenue Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Ad Impressions</Text>
            <Text style={styles.breakdownValue}>{earnings.impressions.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Total Ad Revenue</Text>
            <Text style={styles.breakdownValue}>${earnings.revenue.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Your Share ({earnings.creatorShare}%)</Text>
            <Text style={[styles.breakdownValue, { color: colors.success }]}>
              ${(earnings.revenue * (earnings.creatorShare / 100)).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Withdrawal History</Text>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          </View>
          {earnings.withdrawals.length === 0 ? (
            <Text style={styles.emptyText}>No withdrawals yet</Text>
          ) : (
            earnings.withdrawals.map((w: any) => (
              <View key={w.id} style={styles.withdrawalItem}>
                <View>
                  <Text style={styles.withdrawalAmount}>${w.amount.toFixed(2)}</Text>
                  <Text style={styles.withdrawalDate}>{new Date(w.requested_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.withdrawalStatus, w.status === 'completed' && { color: colors.success }]}>
                  {w.status}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('Payment Settings', 'Configure payment method')}>
          <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.linkText}>Payment Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  balanceCard: { backgroundColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontSize: 40, fontWeight: '800', color: colors.white, marginTop: spacing.xs },
  withdrawBtn: { backgroundColor: colors.white, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.lg, minWidth: 120 },
  withdrawBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  btnDisabled: { opacity: 0.5 },
  minText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  breakdownLabel: { fontSize: 14, color: colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  withdrawalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.background },
  withdrawalAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  withdrawalDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  withdrawalStatus: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
});
