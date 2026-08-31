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

export default function ChannelMonetizationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<'not_applied' | 'pending' | 'approved' | 'rejected'>('not_applied');
  const [isMonetized, setIsMonetized] = useState(false);
  const [requirements, setRequirements] = useState({
    followers: 0,
    minFollowers: 1000,
    views: 0,
    minViews: 10000,
    age: 0,
    minAge: 60,
  });
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    loadMonetizationStatus();
  }, []);

  const loadMonetizationStatus = async () => {
    try {
      const data = await channelsService.getMonetizationStatus(channelId);
      setStatus(data.status);
      setIsMonetized(data.is_monetized);
      setRequirements(data.requirements);
      setEligible(data.eligible);
    } catch (error) {
      console.error('Failed to load monetization status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    Alert.alert(
      'Apply for Monetization',
      'By applying, you agree to our monetization terms and community guidelines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(true);
            try {
              await channelsService.applyForMonetization(channelId);
              Alert.alert('Application Submitted', 'We will review your application within 3-5 business days.');
              loadMonetizationStatus();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit application');
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Monetization</Text>
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
        <Text style={styles.title}>Monetization</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {status === 'not_applied' && (
          <>
            <View style={[styles.card, shadow.soft]}>
              <Ionicons name="cash-outline" size={32} color={colors.primary} />
              <Text style={styles.cardTitle}>Earn with Your Channel</Text>
              <Text style={styles.cardText}>
                Monetize your content through ad revenue sharing. Once approved, you'll earn a percentage of ad revenue generated from your audience.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Eligibility Requirements</Text>

            <View style={[styles.reqCard, shadow.soft]}>
              <View style={styles.reqRow}>
                <Ionicons name={requirements.followers >= requirements.minFollowers ? 'checkmark-circle' : 'close-circle'} size={20} color={requirements.followers >= requirements.minFollowers ? colors.success : colors.textMuted} />
                <Text style={styles.reqText}>{requirements.followers} / {requirements.minFollowers} followers</Text>
              </View>
              <View style={styles.progress}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (requirements.followers / requirements.minFollowers) * 100)}%` }]} />
              </View>
            </View>

            <View style={[styles.reqCard, shadow.soft]}>
              <View style={styles.reqRow}>
                <Ionicons name={requirements.views >= requirements.minViews ? 'checkmark-circle' : 'close-circle'} size={20} color={requirements.views >= requirements.minViews ? colors.success : colors.textMuted} />
                <Text style={styles.reqText}>{requirements.views} / {requirements.minViews} views (30 days)</Text>
              </View>
              <View style={styles.progress}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (requirements.views / requirements.minViews) * 100)}%` }]} />
              </View>
            </View>

            <View style={[styles.reqCard, shadow.soft]}>
              <View style={styles.reqRow}>
                <Ionicons name={requirements.age >= requirements.minAge ? 'checkmark-circle' : 'close-circle'} size={20} color={requirements.age >= requirements.minAge ? colors.success : colors.textMuted} />
                <Text style={styles.reqText}>Channel age: {requirements.age} / {requirements.minAge} days</Text>
              </View>
              <View style={styles.progress}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (requirements.age / requirements.minAge) * 100)}%` }]} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.applyBtn, (!eligible || applying) && styles.btnDisabled]}
              onPress={handleApply}
              disabled={!eligible || applying}
            >
              {applying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.applyBtnText}>{eligible ? 'Apply for Monetization' : 'Not Yet Eligible'}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {status === 'pending' && (
          <View style={[styles.card, shadow.soft, { alignItems: 'center' }]}>
            <Ionicons name="time-outline" size={48} color={colors.primary} />
            <Text style={styles.cardTitle}>Application Pending</Text>
            <Text style={styles.cardText}>
              Your monetization application is under review. We'll notify you once a decision is made.
            </Text>
          </View>
        )}

        {status === 'approved' && (
          <View>
            <View style={[styles.card, shadow.soft, { alignItems: 'center' }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.cardTitle}>Monetization Active</Text>
              <Text style={styles.cardText}>
                Your channel is monetized. View your earnings dashboard to track revenue.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dashboardBtn}
              onPress={() => navigation.navigate('ChannelEarnings', { channelId })}
            >
              <Text style={styles.dashboardBtnText}>View Earnings Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
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
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.xl, marginBottom: spacing.lg },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md },
  cardText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  reqCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  reqText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  progress: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  applyBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  applyBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  dashboardBtn: { backgroundColor: colors.navy, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  dashboardBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
