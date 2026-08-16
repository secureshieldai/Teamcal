import React from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService } from '../../services/api/tracker.service';
import { workoutsService } from '../../services/api/workouts.service';
import { exercisePerformanceService, type PersonalRecord } from '../../services/api/exercisePerformance.service';
import type { TrackerEntry } from '../../types/api';

type Props = {
  onClose: () => void;
};

export default function WorkoutProgressScreen({ onClose }: Props) {
  const photos = useApiQuery(() => trackerService.getEntries('progress-photos', 50), [] as TrackerEntry[], []);
  const { data: streak } = useApiQuery(() => trackerService.getStreak('workouts', 1), 0, []);
  const { data: sessions } = useApiQuery(() => workoutsService.getHistory(200).then((l) => l.length), 0, []);
  const { data: records } = useApiQuery(() => exercisePerformanceService.getRecords(), [] as PersonalRecord[], []);

  const sorted = [...photos.data].sort((a, b) => a.ts - b.ts);
  const before = sorted[0]?.meta as { photo?: string } | undefined;
  const after = sorted[sorted.length - 1]?.meta as { photo?: string } | undefined;
  const hasEnoughForAnalysis = sorted.length >= 2;

  const upload = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled) return;
    await workoutsService.uploadProgressPhoto(picked.assets[0].uri);
    photos.refetch();
  };

  const share = async () => {
    if (!after?.photo) return;
    try {
      await Share.share({ message: 'Check out my transformation progress on TeamCal!', url: after.photo });
    } catch {
      // user cancelled the share sheet
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSubtitle}>Transformation hub</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#FF8A5C', '#FFB877']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.uploadBanner}>
          <Ionicons name="camera" size={22} color={colors.white} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.uploadTitle}>Upload this week's photo</Text>
            <Text style={styles.uploadSubtitle}>A weekly photo is your best transformation record.</Text>
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={upload}>
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionLabel}>WEEKLY PHOTOS</Text>
        {sorted.length === 0 ? (
          <View style={styles.emptyPhotos}>
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>Upload one photo per week.</Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {sorted.map((p) => (
              <Image key={p.id} source={{ uri: (p.meta as { photo?: string }).photo }} style={styles.photoThumb} />
            ))}
          </View>
        )}

        <Text style={styles.cardTitle}>Before & After</Text>
        <View style={[styles.card, shadow.soft]}>
          <View style={styles.beforeAfterRow}>
            <View style={styles.beforeAfterBox}>
              {before?.photo ? <Image source={{ uri: before.photo }} style={styles.beforeAfterImage} /> : <Text style={styles.beforeAfterLabel}>Before</Text>}
            </View>
            <View style={styles.beforeAfterBox}>
              {after?.photo ? <Image source={{ uri: after.photo }} style={styles.beforeAfterImage} /> : <Text style={styles.beforeAfterLabel}>After</Text>}
            </View>
          </View>
          <Text style={styles.generatedCaption}>Generated with TeamCal AI</Text>
          <View style={styles.beforeAfterActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => photos.refetch()}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={share} disabled={!after?.photo}>
              <Ionicons name="share-social" size={15} color={colors.white} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient colors={['#EDE9FE', '#FCE7F3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.aiLabel}>AI ANALYSIS</Text>
          </View>
          <Text style={styles.aiBody}>
            {hasEnoughForAnalysis
              ? `${sorted.length} weekly photos captured — steady tracking is the biggest predictor of visible progress. Keep it up!`
              : 'Upload two photos to unlock your AI transformation analysis.'}
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, shadow.soft]}>
            <View style={styles.statValueRow}>
              <Ionicons name="flame" size={14} color={colors.primary} />
              <Text style={styles.statValue}>{streak}</Text>
            </View>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statBox, shadow.soft]}>
            <Text style={styles.statValue}>{sessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statBox, shadow.soft]}>
            <Text style={styles.statValue}>{records.length}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <View style={styles.prHeader}>
            <Ionicons name="ribbon" size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Personal records</Text>
          </View>
          {records.length === 0 ? (
            <Text style={styles.emptySubtitle}>Complete a workout to start tracking personal records.</Text>
          ) : (
            records.map((r) => (
              <View key={r.exerciseName} style={styles.prRow}>
                <Text style={styles.prName}>{r.exerciseName}</Text>
                <Text style={styles.prValue}>
                  {r.weight}kg × {r.reps}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  headerSubtitle: { fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  uploadTitle: { fontSize: 14, fontWeight: '800', color: colors.white },
  uploadSubtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  uploadBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  uploadBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  emptyPhotos: { alignItems: 'center', paddingVertical: spacing.xl, gap: 4 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  emptySubtitle: { fontSize: 12, color: colors.textMuted },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumb: { width: 72, height: 96, borderRadius: radii.md, backgroundColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  beforeAfterRow: { flexDirection: 'row', gap: spacing.md },
  beforeAfterBox: {
    flex: 1,
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  beforeAfterImage: { width: '100%', height: '100%' },
  beforeAfterLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  generatedCaption: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  beforeAfterActions: { flexDirection: 'row', gap: spacing.md },
  resetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  aiCard: { borderRadius: radii.xl, padding: spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  aiLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 },
  aiBody: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, paddingVertical: spacing.lg },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  prHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prName: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  prValue: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
});
