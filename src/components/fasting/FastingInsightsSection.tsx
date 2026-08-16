import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { METABOLIC_STAGES, type MetabolicStage } from '../../data/fastingData';
import { MARKERS, MARKER_CONTENT, STAGE_STYLES, STAGE_SUMMARY, type StageId } from '../../data/fastingInsights';

type Props = {
  stage: MetabolicStage;
  active: boolean;
};

function isStageId(id: string): id is StageId {
  return id === 'fed' || id === 'fat-burning' || id === 'ketosis' || id === 'autophagy';
}

export default function FastingInsightsSection({ stage, active }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const stageId: StageId = isStageId(stage.id) ? stage.id : 'fed';
  const summary = STAGE_SUMMARY[stageId];

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.eyebrow}>WHAT'S HAPPENING RIGHT NOW</Text>
        <Text style={[styles.headline, { color: STAGE_STYLES[stageId].color }]}>{summary.headline}</Text>
        <Text style={styles.blurb}>{active ? summary.activeBlurb : 'Start a fast to see live biological changes.'}</Text>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>IN YOUR BODY NOW</Text>
        {MARKERS.map((marker) => {
          const content = MARKER_CONTENT[marker.id][stageId];
          const isOpen = expanded.has(marker.id);
          return (
            <View key={marker.id} style={styles.markerWrap}>
              <TouchableOpacity style={styles.markerRow} onPress={() => toggle(marker.id)} activeOpacity={0.75}>
                <View style={[styles.markerIcon, { backgroundColor: marker.bg }]}>
                  <Ionicons name={marker.icon} size={16} color={marker.color} />
                </View>
                <View style={styles.markerInfo}>
                  <Text style={styles.markerLabel}>{marker.label.toUpperCase()}</Text>
                  <Text style={styles.markerValue}>{content.value}</Text>
                </View>
                <View style={styles.tapRow}>
                  <Text style={styles.tapText}>Tap</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color={colors.primary} />
                </View>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.expandedBody}>
                  <Text style={styles.expandedLabel}>WHAT IT IS</Text>
                  <Text style={styles.expandedText}>{content.whatItIs}</Text>
                  <Text style={[styles.expandedLabel, { marginTop: spacing.sm }]}>WHY IT MATTERS</Text>
                  <Text style={styles.expandedText}>{content.whyItMatters}</Text>
                  <Text style={[styles.expandedLabel, { marginTop: spacing.sm }]}>WHAT THIS MEANS FOR YOU NOW</Text>
                  <Text style={styles.expandedText}>{content.meansNow}</Text>
                  <Text style={[styles.expandedLabel, { marginTop: spacing.sm }]}>WHAT TO EXPECT NEXT</Text>
                  <Text style={styles.expandedText}>{content.expectNext}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>YOUR BIOLOGICAL STAGES</Text>
        {METABOLIC_STAGES.map((s) => {
          const style = STAGE_STYLES[isStageId(s.id) ? s.id : 'fed'];
          const isCurrent = active && s.id === stage.id;
          return (
            <View
              key={s.id}
              style={[styles.stageRow, isCurrent && { backgroundColor: style.bg, borderLeftWidth: 4, borderLeftColor: style.color, paddingLeft: spacing.md - 4 }]}
            >
              <View style={[styles.stageIcon, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={16} color={style.color} />
              </View>
              <View style={styles.stageInfo}>
                <View style={styles.stageTitleRow}>
                  <Text style={[styles.stageLabel, { color: style.color }]}>{s.label}</Text>
                  <Text style={styles.stageHours}>{s.hours}h+</Text>
                  {isCurrent && (
                    <View style={[styles.nowBadge, { backgroundColor: style.color }]}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stageDescription}>{s.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <LinearGradient colors={['#FDECE4', '#FFD9C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blazeCard}>
        <View style={styles.blazeIcon}>
          <Ionicons name="sparkles" size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.blazeLabel}>BLAZE INSIGHT</Text>
          <Text style={styles.blazeText}>
            {active ? summary.blazeInsight : "Start a fast and I'll narrate exactly what changes in your body every hour."}
          </Text>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  blurb: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  markerWrap: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInfo: {
    flex: 1,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  markerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  tapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tapText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  expandedBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 2,
  },
  expandedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  expandedText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageInfo: {
    flex: 1,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageLabel: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  stageHours: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  nowBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  nowBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
  stageDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  blazeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  blazeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blazeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  blazeText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 19,
  },
});
