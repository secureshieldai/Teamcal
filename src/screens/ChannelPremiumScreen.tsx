import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelMonetization'>;

export default function ChannelPremiumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await channelsService.getMonetizationStatus(channelId);
      setStatus(data);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!status?.eligible) {
      Alert.alert('Not Eligible', 'Your channel does not meet the requirements for monetization yet.');
      return;
    }

    Alert.alert(
      'Apply for Monetization',
      'Once approved, you\'ll earn revenue from ads shown on your channel content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(true);
            try {
              await channelsService.applyForMonetization(channelId);
              Alert.alert('Success', 'Your application has been submitted! We\'ll review it within 3-5 business days.');
              loadStatus();
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Channel Monetization</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Premium Badge */}
        <View style={styles.premiumHeader}>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
          </View>
          <Text style={styles.premiumTitle}>Monetize Your Channel</Text>
          <Text style={styles.premiumDesc}>Earn revenue by creating content for your community</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, status?.is_monetized && styles.statusBadgeActive]}>
              <Text style={[styles.statusText, status?.is_monetized && styles.statusTextActive]}>
                {status?.is_monetized ? 'MONETIZED' : status?.status?.toUpperCase() || 'NOT APPLIED'}
              </Text>
            </View>
          </View>
          {status?.approved_at && (
            <Text style={styles.statusDate}>Approved {new Date(status.approved_at).toLocaleDateString()}</Text>
          )}
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <Text style={styles.sectionDesc}>Meet all criteria to apply for monetization</Text>

          <View style={styles.requirementRow}>
            <Ionicons
              name={status?.requirements?.followers >= status?.requirements?.minFollowers ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={status?.requirements?.followers >= status?.requirements?.minFollowers ? colors.primary : colors.border}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.requirementLabel}>
                {status?.requirements?.followers || 0} / {status?.requirements?.minFollowers || 1000} followers
              </Text>
              <Text style={styles.requirementDesc}>Minimum 1,000 followers</Text>
            </View>
          </View>

          <View style={styles.requirementRow}>
            <Ionicons
              name={status?.requirements?.views >= status?.requirements?.minViews ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={status?.requirements?.views >= status?.requirements?.minViews ? colors.primary : colors.border}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.requirementLabel}>
                {status?.requirements?.views || 0} / {status?.requirements?.minViews || 4000} total views
              </Text>
              <Text style={styles.requirementDesc}>4,000 views in last 12 months</Text>
            </View>
          </View>

          <View style={styles.requirementRow}>
            <Ionicons
              name={status?.requirements?.age >= status?.requirements?.minAge ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={status?.requirements?.age >= status?.requirements?.minAge ? colors.primary : colors.border}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.requirementLabel}>{status?.requirements?.age || 0} days old</Text>
              <Text style={styles.requirementDesc}>Channel must be at least 30 days old</Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monetization Benefits</Text>
          
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Earn Revenue</Text>
              <Text style={styles.benefitDesc}>Get 40% of ad revenue from your content</Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Verified Badge</Text>
              <Text style={styles.benefitDesc}>Get a verified checkmark on your channel</Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Advanced Analytics</Text>
              <Text style={styles.benefitDesc}>Access detailed performance metrics</Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Priority Promotion</Text>
              <Text style={styles.benefitDesc}>Featured in discovery and recommendations</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {!status?.is_monetized && (
          <TouchableOpacity
            style={[styles.applyBtn, (!status?.eligible || applying) && styles.btnDisabled]}
            onPress={handleApply}
            disabled={!status?.eligible || applying}
          >
            <Text style={styles.applyBtnText}>
              {status?.status === 'pending'
                ? 'Application Pending'
                : applying
                ? 'Applying...'
                : status?.eligible
                ? 'Apply for Monetization'
                : 'Requirements Not Met'}
            </Text>
          </TouchableOpacity>
        )}

        {status?.is_monetized && (
          <TouchableOpacity
            style={styles.earningsBtn}
            onPress={() => navigation.navigate('ChannelEarnings', { channelId })}
          >
            <Ionicons name="trending-up" size={20} color={colors.white} />
            <Text style={styles.earningsBtnText}>View Earnings</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  premiumHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  premiumBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  premiumTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  premiumDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  statusCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  statusBadge: { backgroundColor: colors.border, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusBadgeActive: { backgroundColor: '#4CAF50' },
  statusText: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  statusTextActive: { color: colors.white },
  statusDate: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  section: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  sectionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  requirementLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  requirementDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  benefitDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  applyBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  applyBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  earningsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#4CAF50', borderRadius: radii.pill, paddingVertical: spacing.lg },
  earningsBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
