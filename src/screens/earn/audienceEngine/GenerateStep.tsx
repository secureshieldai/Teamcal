import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';
import { audienceEngineGeneratedPosts } from '../../../data/earnData';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export default function GenerateStep({ onNext, onBack }: Props) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 100;
        }
        return Math.min(100, p + 4);
      });
    }, 90);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const revealedCount = Math.floor((progress / 100) * audienceEngineGeneratedPosts.length);
  const done = progress >= 100;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Generating Your Content</Text>
      <Text style={styles.subtitle}>Our AI is creating high-quality posts for you. This may take a few moments.</Text>

      <View style={[styles.progressCard, shadow.card]}>
        <View style={styles.progressTopRow}>
          <View style={styles.progressIcon}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>{done ? 'Content ready!' : 'AI is generating your content…'}</Text>
            <Text style={styles.progressSubtitle}>{done ? 'All posts have been created.' : 'Please wait while we create engaging posts.'}</Text>
          </View>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{progress}%</Text>

        <View style={styles.statusRow}>
          <StatusItem label="Analyzing content" done={progress > 10} />
          <StatusItem label="Crafting posts" done={progress > 50} active={progress > 10 && progress <= 50} />
          <StatusItem label="Optimizing for platforms" done={progress >= 100} active={progress > 50 && progress < 100} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Live Generation Preview</Text>
      <View style={styles.previewGrid}>
        {audienceEngineGeneratedPosts.map((post, i) => (
          <View key={post.id} style={styles.previewItem}>
            {i < revealedCount ? (
              <Image source={{ uri: post.thumbnail }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, styles.previewImagePending]}>
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.previewCaption} numberOfLines={2}>
              {i < revealedCount ? post.caption : 'Generating…'}
            </Text>
            <Text style={[styles.previewStatus, { color: i < revealedCount ? colors.success : colors.textMuted }]}>
              {i < revealedCount ? 'Completed' : i === revealedCount ? 'Generating…' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }, !done && styles.primaryBtnDisabled]} onPress={onNext} activeOpacity={0.85} disabled={!done}>
          <Text style={styles.primaryBtnText}>{done ? 'Continue to Review' : 'Generating…'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatusItem({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <View style={styles.statusItem}>
      <Ionicons
        name={done ? 'checkmark-circle' : active ? 'ellipse' : 'ellipse-outline'}
        size={14}
        color={done ? colors.success : active ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.statusLabel, done && { color: colors.success }, active && { color: colors.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 17 },
  progressCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  progressTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  progressSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  progressBarTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: spacing.lg, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  progressPercent: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'right', marginTop: 4 },
  statusRow: { marginTop: spacing.md, gap: spacing.sm },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewItem: { width: '48%' },
  previewImage: { width: '100%', height: 100, borderRadius: radii.lg, backgroundColor: colors.border },
  previewImagePending: { alignItems: 'center', justifyContent: 'center' },
  previewCaption: { fontSize: 11, color: colors.textPrimary, marginTop: 6, lineHeight: 15 },
  previewStatus: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnDisabled: { backgroundColor: colors.ringTrack },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
