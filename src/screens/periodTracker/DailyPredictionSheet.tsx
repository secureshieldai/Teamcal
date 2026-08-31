import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';
import { DAILY_TIPS, PHASE_FEELING, PHASE_INFO } from '../../data/periodTrackerData';

type Props = {
  visible: boolean;
  date: Date | null;
  onClose: () => void;
  onChangeDate: (d: Date) => void;
  onLogSymptoms: (d: Date) => void;
  onEditCycleInfo: () => void;
};

const DAY_MS = 86_400_000;

export default function DailyPredictionSheet({ visible, date, onClose, onChangeDate, onLogSymptoms, onEditCycleInfo }: Props) {
  const insets = useSafeAreaInsets();
  const { getDayDetail, cyclesTracked } = usePeriodTracker();

  if (!date) return null;
  const detail = getDayDetail(date.getTime());
  const info = PHASE_INFO[detail.phase];
  const tips = DAILY_TIPS[detail.phase];
  const feeling = PHASE_FEELING[detail.phase];
  const lowData = cyclesTracked < 3;

  const fullDate = date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const periodLine = detail.isPeriod
    ? 'Period is predicted for today'
    : detail.isOvulation
    ? 'Predicted ovulation day'
    : detail.isFertile
    ? 'In your predicted fertile window'
    : `Period expected in about ${detail.daysUntilPeriod} day${detail.daysUntilPeriod === 1 ? '' : 's'}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Daily Prediction</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="calendar-outline" size={21} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          {/* Date navigator */}
          <View style={s.dateNav}>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => onChangeDate(new Date(date.getTime() - DAY_MS))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.dateText}>{fullDate}</Text>
              <Text style={s.cycleDayText}>Cycle Day {detail.cycleDay}</Text>
            </View>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => onChangeDate(new Date(date.getTime() + DAY_MS))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Phase hero card */}
          <View style={[s.phaseCard, { backgroundColor: info.bgFrom }]}>
            <View style={s.phaseCardText}>
              <View style={s.estimatedPill}>
                <Text style={[s.estimatedPillText, { color: info.color }]}>Estimated</Text>
              </View>
              <Text style={[s.phaseTitle, { color: colors.navy }]}>{info.label.replace(' phase', '')} phase</Text>
              <Text style={[s.periodLine, { color: info.color }]}>{periodLine}</Text>
              <Text style={s.phaseVibe}>{info.vibe}</Text>
            </View>
            <PhaseGraphic color={info.color} progress={detail.cycleDay / 28} />
          </View>

          {lowData && (
            <View style={s.note}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={s.noteText}>This is an early estimate. Predictions may improve as you log more cycles.</Text>
            </View>
          )}

          {/* How you may feel */}
          <Text style={s.sectionTitle}>How you may feel</Text>
          <FeelingRow icon="heart" iconBg="#FDE1E7" iconColor="#E85D75" title="Mood" text={feeling.mood} />
          <FeelingRow icon="flash" iconBg="#FFE9D2" iconColor="#F59E0B" title="Energy" text={feeling.energy} />
          <FeelingRow icon="body" iconBg="#EDE4FB" iconColor="#8B5CF6" title="Body" text={feeling.body} />
          <Text style={s.disclaimer}>These are possibilities, not guarantees.</Text>

          {/* Tips */}
          <Text style={s.sectionTitle}>5 tips for today</Text>
          <View style={[s.card, shadow.soft]}>
            {tips.map((tip, i) => (
              <View key={tip.title} style={[s.tipRow, i === tips.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.tipNumber}><Text style={s.tipNumberText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipSubtitle}>{tip.subtitle}</Text>
                </View>
                <Ionicons name={tip.icon} size={18} color={info.color} />
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.actionBtn} onPress={() => onLogSymptoms(date)}>
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={s.actionBtnText}>Log symptoms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={onEditCycleInfo}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={s.actionBtnText}>Edit cycle info</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Back to calendar</Text>
          </TouchableOpacity>

          <Text style={s.medicalNote}>Predictions are estimates and are not medical advice or contraception.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FeelingRow({ icon, iconBg, iconColor, title, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; iconBg: string; iconColor: string; title: string; text: string }) {
  return (
    <View style={[s.feelingCard, shadow.soft]}>
      <View style={[s.feelingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.feelingTitle}>{title}</Text>
        <Text style={s.feelingText}>{text}</Text>
      </View>
    </View>
  );
}

// Decorative progress-ring graphic on the phase card — purely illustrative.
function PhaseGraphic({ color, progress }: { color: string; progress: number }) {
  const size = 96;
  const r = 34;
  const cx = size / 2;
  const cy = size / 2;
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);
  const dashDots = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + (r + 14) * Math.cos(a), y: cy + (r + 14) * Math.sin(a) };
  });
  return (
    <Svg width={size + 30} height={size + 30} style={{ marginRight: -10 }}>
      <Circle cx={cx + 15} cy={cy + 15} r={r} stroke={color} strokeOpacity={0.25} strokeWidth={2} fill="none" />
      {dashDots.map((d, i) => (
        <Circle key={i} cx={d.x + 15} cy={d.y + 15} r={1.6} fill={color} opacity={0.35} />
      ))}
      <Circle cx={dotX + 15} cy={dotY + 15} r={9} fill={color} />
    </Svg>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.navy, fontSize: 19 },
  content: { padding: spacing.lg, gap: spacing.md },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDECE4', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dateNavBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  cycleDayText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  phaseCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl, padding: spacing.lg, overflow: 'hidden' },
  phaseCardText: { flex: 1 },
  estimatedPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, marginBottom: spacing.sm },
  estimatedPillText: { fontSize: 11, fontWeight: '700' },
  phaseTitle: { fontSize: 26, fontWeight: '900' },
  periodLine: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  phaseVibe: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  noteText: { flex: 1, fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  feelingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  feelingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feelingTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  feelingText: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  disclaimer: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tipNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FDE1E7', alignItems: 'center', justifyContent: 'center' },
  tipNumberText: { fontSize: 12, fontWeight: '800', color: '#E85D75' },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  tipSubtitle: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm + 2 },
  actionBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  closeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  closeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.navy },
  medicalNote: { fontSize: 10.5, color: colors.textMuted, lineHeight: 14, textAlign: 'center', fontStyle: 'italic' },
});
