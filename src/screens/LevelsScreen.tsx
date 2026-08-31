import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, shadow, spacing } from '../theme';
import { LEVELS, POINT_ACTIVITIES, getLevelProgress } from '../data/levelsData';
import { useProfile } from '../hooks/useProfile';

export default function LevelsScreen() {
  const navigation = useNavigation();
  const { levelData } = useProfile();
  const lifetimePoints = levelData?.lifetimePoints ?? 0;
  const activeDays = levelData?.activeDays ?? 0;
  const { current, next, pointsProgress, pointsNeeded, daysNeeded } = getLevelProgress(lifetimePoints, activeDays);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Levels & Points</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Current status */}
        <View style={[s.card, { backgroundColor: current.color }]}>
          <Text style={s.badgeLg}>{current.badge}</Text>
          <Text style={s.currentLevel}>Level {current.level} — {current.name}</Text>
          <Text style={s.currentPts}>{lifetimePoints.toLocaleString()} lifetime points · {activeDays} active days</Text>
          {next && (
            <>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${pointsProgress}%` }]} />
              </View>
              <Text style={s.progressCaption}>
                {pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} pts` : '✓ Points met'}{daysNeeded > 0 ? ` · ${daysNeeded} more active days` : ' · Days met'} to Level {next.level}
              </Text>
            </>
          )}
        </View>

        {/* Recent points history */}
        {(levelData?.recentHistory ?? []).length > 0 && (
          <>
            <Text style={s.sectionLabel}>RECENT POINTS</Text>
            <View style={[s.listCard, shadow.soft]}>
              {(levelData?.recentHistory ?? []).map((h, i) => (
                <View key={i} style={[s.row, i > 0 && s.rowBorder]}>
                  <Text style={s.historyLabel}>{h.label}</Text>
                  <Text style={s.historyPts}>+{h.points}</Text>
                  <Text style={s.historyDate}>{new Date(h.date).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* How to earn */}
        <Text style={s.sectionLabel}>HOW TO EARN POINTS</Text>
        <View style={[s.listCard, shadow.soft]}>
          {POINT_ACTIVITIES.map((a, i) => (
            <View key={a.id} style={[s.row, i > 0 && s.rowBorder]}>
              <View style={s.actIcon}>
                <Ionicons name={a.icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.actLabel}>{a.label}</Text>
                {a.dailyLimit > 0 && <Text style={s.actLimit}>Up to {a.dailyLimit}× per day</Text>}
              </View>
              <Text style={s.actPts}>+{a.points} pts</Text>
            </View>
          ))}
        </View>

        {/* All levels */}
        <Text style={s.sectionLabel}>ALL LEVELS</Text>
        {LEVELS.map((lvl) => {
          const unlocked = lifetimePoints >= lvl.pointsRequired && activeDays >= lvl.activeDaysRequired;
          const isCurrent = lvl.level === current.level;
          return (
            <View key={lvl.level} style={[s.levelCard, shadow.soft, isCurrent && { borderWidth: 2, borderColor: lvl.color }]}>
              <View style={[s.levelBadge, { backgroundColor: unlocked ? lvl.color : colors.border }]}>
                <Text style={s.levelBadgeText}>{lvl.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.levelName, !unlocked && { color: colors.textMuted }]}>Level {lvl.level} – {lvl.name}</Text>
                  {isCurrent && <View style={[s.curBadge, { backgroundColor: lvl.color }]}><Text style={s.curBadgeText}>Current</Text></View>}
                  {!unlocked && <Ionicons name="lock-closed" size={12} color={colors.textMuted} />}
                </View>
                <Text style={s.levelReq}>
                  {lvl.pointsRequired.toLocaleString()} pts{lvl.activeDaysRequired > 0 ? ` · ${lvl.activeDaysRequired} active days` : ''}
                </Text>
                <Text style={s.levelBenefits}>{lvl.benefits.join(' · ')}</Text>
              </View>
            </View>
          );
        })}

        <Text style={s.note}>
          Rewards points (spendable) are separate from lifetime points. Spending rewards never reduces your level.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.navy },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  card: { borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center' },
  badgeLg: { fontSize: 40 },
  currentLevel: { fontSize: 20, fontWeight: '800', color: colors.white, marginTop: spacing.sm },
  currentPts: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: spacing.md },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.white },
  progressCaption: { fontSize: 11.5, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs, textAlign: 'center' },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.sm },
  listCard: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF5EE', alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  actLimit: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  actPts: { fontSize: 13, fontWeight: '700', color: colors.primary },
  historyLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  historyPts: { fontSize: 13, fontWeight: '700', color: colors.primary },
  historyDate: { fontSize: 11, color: colors.textMuted, marginLeft: spacing.sm },
  levelCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  levelBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: 22 },
  levelName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  levelReq: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  levelBenefits: { fontSize: 11.5, color: colors.textMuted, marginTop: 3, lineHeight: 16 },
  curBadge: { borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  curBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  note: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.sm },
});
