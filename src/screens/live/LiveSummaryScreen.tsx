import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { liveService, type LiveStream } from '../../services/api/live.service';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveSummary'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function LiveSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const { streamId } = params;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    liveService.getStream(streamId)
      .then(setStream)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [streamId]);

  async function handleSaveReplay(save: boolean) {
    try {
      setSaving(true);
      await liveService.saveReplay(streamId, save);
      Alert.alert(
        save ? 'Replay saved' : 'Recording discarded',
        save ? 'Your replay is now available on your profile.' : 'The recording has been discarded.',
        [{ text: 'OK', onPress: () => navigation.navigate('MainTabs') }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const duration = stream?.duration_seconds ?? 0;

  const stats = [
    { icon: 'eye-outline', label: 'Total viewers', value: String(stream?.total_viewers ?? 0) },
    { icon: 'trending-up-outline', label: 'Peak viewers', value: String(stream?.peak_viewers ?? 0) },
    { icon: 'chatbubble-outline', label: 'Comments', value: String(stream?.comment_count ?? 0) },
    { icon: 'heart-outline', label: 'Reactions', value: String(stream?.reaction_count ?? 0) },
    { icon: 'person-add-outline', label: 'New followers', value: String(stream?.new_followers ?? 0) },
    { icon: 'time-outline', label: 'Duration', value: fmtDuration(duration) },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.badgeWrap}>
            <Ionicons name="radio" size={32} color={colors.primary} />
          </View>
          <Text style={s.title}>Stream ended</Text>
          <Text style={s.subtitle} numberOfLines={2}>{stream?.title}</Text>
        </View>

        {/* Stats grid */}
        <View style={s.grid}>
          {stats.map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Ionicons name={stat.icon as any} size={22} color={colors.primary} />
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Replay section */}
        <View style={s.replaySection}>
          <Text style={s.replayTitle}>Save as replay?</Text>
          <Text style={s.replaySub}>
            Saved replays are labelled as "Replay" and appear on your profile. Viewers can watch them anytime.
          </Text>

          {saving ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <View style={s.replayBtns}>
              <TouchableOpacity style={s.saveBtnPrimary} onPress={() => handleSaveReplay(true)} activeOpacity={0.85}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={s.saveBtnPrimaryText}>Save replay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtnSecondary} onPress={() => handleSaveReplay(false)} activeOpacity={0.85}>
                <Text style={s.saveBtnSecondaryText}>Discard</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.85}>
          <Text style={s.homeBtnText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  badgeWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { width: '46%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  statValue: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  statLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  replaySection: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  replayTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  replaySub: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  replayBtns: { gap: spacing.sm },
  saveBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 14 },
  saveBtnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  saveBtnSecondary: { alignItems: 'center', paddingVertical: 12 },
  saveBtnSecondaryText: { color: colors.textSecondary, fontSize: 14 },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.md },
  homeBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
