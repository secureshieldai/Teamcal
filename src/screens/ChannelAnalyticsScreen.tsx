import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import type { ChannelAnalytics } from '../types/channels';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelAnalytics'>;

export default function ChannelAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [channelId]);

  const loadAnalytics = async () => {
    try {
      const data = await channelsService.getAnalytics(channelId);
      setAnalytics(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>{error}</Text>
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
        <Text style={styles.title}>Analytics (30 days)</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, shadow.soft]}>
          <Text style={styles.metricLabel}>Accounts Reached</Text>
          <Text style={styles.metricValue}>{analytics?.totals.post_views.toLocaleString()}</Text>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <Text style={styles.metricLabel}>Net New Followers</Text>
          <Text style={[styles.metricValue, analytics && analytics.totals.net_followers < 0 && { color: colors.macroProtein }]}>
            {analytics?.totals.net_followers > 0 ? '+' : ''}{analytics?.totals.net_followers}
          </Text>
          <Text style={styles.metricSub}>
            {analytics?.totals.new_followers} gained · {analytics?.totals.unfollows} lost
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.smallCard, shadow.soft]}>
            <Text style={styles.smallLabel}>Reactions</Text>
            <Text style={styles.smallValue}>{analytics?.totals.reactions}</Text>
          </View>
          <View style={[styles.smallCard, shadow.soft]}>
            <Text style={styles.smallLabel}>Comments</Text>
            <Text style={styles.smallValue}>{analytics?.totals.comments}</Text>
          </View>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <Text style={styles.metricLabel}>Engagement Rate</Text>
          <Text style={styles.metricValue}>{analytics?.totals.engagement_rate}%</Text>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <Text style={styles.metricLabel}>Total Followers</Text>
          <Text style={styles.metricValue}>{analytics?.current_followers}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  metricLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  metricValue: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
  metricSub: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  smallCard: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  smallLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  smallValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
});
