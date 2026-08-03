import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, radii, shadow, spacing } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function HeroPhoto({ uri, height = 220 }: { uri: string; height?: number }) {
  return <Image source={{ uri }} style={[styles.photo, { height }]} />;
}

export function IconChipsRow({ items }: { items: { icon: IconName; label: string }[] }) {
  return (
    <View style={styles.chipsRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.chip}>
          <View style={styles.chipIcon}>
            <Ionicons name={item.icon} size={22} color={colors.primary} />
          </View>
          <Text style={styles.chipLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function CalorieRing({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.dialRing}>
      <Text style={styles.dialValue}>{value}</Text>
      <Text style={styles.dialLabel}>{label}</Text>
    </View>
  );
}

export function AIGrid({ items }: { items: { icon: IconName; label: string }[] }) {
  return (
    <View style={styles.aiGridWrap}>
      {items.map((item) => (
        <View key={item.label} style={[styles.aiGridItem, shadow.soft]}>
          <View style={styles.chipIcon}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.aiGridLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function RobotFace() {
  return (
    <View style={styles.robotOuter}>
      <View style={styles.robotAntennaRow}>
        <View style={styles.robotAntennaDot} />
      </View>
      <View style={styles.robotHead}>
        <View style={styles.robotEyeRow}>
          <View style={styles.robotEye} />
          <View style={styles.robotEye} />
        </View>
        <View style={styles.robotMouth} />
      </View>
    </View>
  );
}

export function AIToolsList({ items }: { items: { icon: IconName; label: string }[] }) {
  return (
    <View style={[styles.card, shadow.card]}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.listRow, i === items.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.listIcon}>
            <Ionicons name={item.icon} size={16} color={colors.primary} />
          </View>
          <Text style={styles.listLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      ))}
    </View>
  );
}

export function ScanResultCard({ uri, title, kcal, macros }: { uri: string; title: string; kcal: number; macros: string }) {
  return (
    <View style={styles.scanWrap}>
      <View style={styles.scanPhotoWrap}>
        <Image source={{ uri }} style={styles.scanPhoto} />
        <View style={styles.scanBadge}>
          <Text style={styles.scanBadgeText}>Scanning...</Text>
        </View>
      </View>
      <View style={[styles.scanCard, shadow.card]}>
        <Text style={styles.scanTitle}>{title}</Text>
        <Text style={styles.scanKcal}>{kcal} kcal</Text>
        <Text style={styles.scanMacros}>{macros}</Text>
      </View>
    </View>
  );
}

export function TrophyGraphic({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <View style={styles.trophyWrap}>
      <View style={styles.trophyCircle}>
        <Ionicons name="trophy" size={56} color={colors.primary} />
        <Ionicons name="sparkles" size={16} color={colors.primary} style={styles.sparkleTopLeft} />
        <Ionicons name="sparkles" size={14} color={colors.primary} style={styles.sparkleBottomRight} />
      </View>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LeaderboardMini({
  entries,
  you,
}: {
  entries: { rank: number; name: string; points: string; avatar: string }[];
  you: { rank: number; name: string; points: string; avatar: string };
}) {
  return (
    <View style={[styles.card, shadow.card, { paddingVertical: spacing.sm }]}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>This Week</Text>
        <Ionicons name="trophy" size={16} color={colors.primary} />
      </View>
      {entries.map((entry) => (
        <View key={entry.rank} style={styles.leaderboardRow}>
          <Text style={styles.leaderboardRank}>{entry.rank}</Text>
          <Avatar uri={entry.avatar} size={28} />
          <Text style={styles.leaderboardName}>{entry.name}</Text>
          <Text style={styles.leaderboardPoints}>{entry.points}</Text>
        </View>
      ))}
      <View style={styles.leaderboardYouRow}>
        <Text style={[styles.leaderboardRank, { color: colors.white }]}>{you.rank}</Text>
        <Avatar uri={you.avatar} size={28} />
        <Text style={[styles.leaderboardName, { color: colors.white }]}>{you.name}</Text>
        <Text style={[styles.leaderboardPoints, { color: colors.white }]}>{you.points}</Text>
      </View>
    </View>
  );
}

export function FeedPostMini({
  avatar,
  name,
  time,
  photo,
  caption,
  likes,
  comments,
}: {
  avatar: string;
  name: string;
  time: string;
  photo: string;
  caption: string;
  likes: number;
  comments: number;
}) {
  return (
    <View style={[styles.card, shadow.card, { padding: 0, overflow: 'hidden', width: 260 }]}>
      <View style={styles.postHeader}>
        <Avatar uri={avatar} size={32} />
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={styles.postName}>{name}</Text>
          <Text style={styles.postTime}>{time}</Text>
        </View>
      </View>
      <Text style={styles.postCaption}>{caption}</Text>
      <Image source={{ uri: photo }} style={styles.postPhoto} />
      <View style={styles.postActions}>
        <View style={styles.postActionItem}>
          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.postActionText}>{likes}</Text>
        </View>
        <View style={styles.postActionItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.postActionText}>{comments}</Text>
        </View>
        <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
      </View>
    </View>
  );
}

export function JourneyPhoto({ uri, height = 230 }: { uri: string; height?: number }) {
  return (
    <View style={styles.journeyWrap}>
      <Image source={{ uri }} style={[styles.photo, { height }]} />
      <View style={styles.journeyBadge}>
        <Ionicons name="trophy" size={22} color={colors.white} />
      </View>
    </View>
  );
}

export function FeatureChecklist({ items, badge }: { items: { icon: IconName; label: string }[]; badge: string }) {
  return (
    <View style={{ width: '100%' }}>
      <View style={[styles.card, shadow.card, styles.checklistGrid]}>
        {items.map((item) => (
          <View key={item.label} style={styles.checklistItem}>
            <View style={styles.listIcon}>
              <Ionicons name={item.icon} size={15} color={colors.primary} />
            </View>
            <Text style={styles.checklistLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.checklistBadge}>
        <Ionicons name="star" size={14} color={colors.primary} />
        <Text style={styles.checklistBadgeText}>{badge}</Text>
      </View>
    </View>
  );
}

export function GiftBoxGraphic() {
  return (
    <View style={styles.giftWrap}>
      <View style={styles.giftCircle}>
        <Ionicons name="gift" size={64} color={colors.primary} />
      </View>
      <Ionicons name="sparkles" size={18} color={colors.primary} style={styles.giftSparkleTopLeft} />
      <Ionicons name="sparkles" size={14} color={colors.primary} style={styles.giftSparkleBottomRight} />
    </View>
  );
}

export function BellGraphic() {
  return (
    <View style={styles.bellWrap}>
      <View style={styles.giftCircle}>
        <Ionicons name="notifications" size={60} color={colors.primary} />
      </View>
      <View style={styles.bellBadge}>
        <Text style={styles.bellBadgeText}>1</Text>
      </View>
    </View>
  );
}

export function AllSetCheck() {
  return (
    <View style={styles.trophyWrap}>
      <View style={[styles.trophyCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={72} color={colors.white} />
      </View>
      <Ionicons name="sparkles" size={18} color={colors.primary} style={styles.sparkleTopLeft} />
      <Ionicons name="sparkles" size={14} color={colors.primary} style={styles.sparkleBottomRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: colors.border,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  chip: {
    alignItems: 'center',
    width: 82,
  },
  chipIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dialRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 14,
    borderColor: colors.ringTrack,
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dialLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  aiGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  aiGridItem: {
    width: '46%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  aiGridLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  robotOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotAntennaRow: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
  },
  robotAntennaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  robotHead: {
    width: 90,
    height: 74,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotEyeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  robotEye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  robotMouth: {
    width: 30,
    height: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: colors.primary,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scanWrap: {
    width: '100%',
    alignItems: 'center',
  },
  scanPhotoWrap: {
    width: '100%',
    height: 190,
  },
  scanPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: radii.xl,
    backgroundColor: colors.border,
  },
  scanBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  scanBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  scanCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: -spacing.xl,
    width: '88%',
  },
  scanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scanKcal: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  scanMacros: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  trophyWrap: {
    alignItems: 'center',
    width: '100%',
  },
  trophyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 18,
    right: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  leaderboardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  leaderboardRank: {
    width: 16,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  leaderboardPoints: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leaderboardYouRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  postName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  postCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  postPhoto: {
    width: '100%',
    height: 130,
    backgroundColor: colors.border,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
  },
  postActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  journeyWrap: {
    width: '100%',
    position: 'relative',
  },
  journeyBadge: {
    position: 'absolute',
    bottom: -18,
    left: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  checklistItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    backgroundColor: '#FFEDE3',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm + 2,
  },
  checklistBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  giftWrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  giftCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftSparkleTopLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  giftSparkleBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 4,
  },
  bellWrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 14,
    right: 20,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 3,
    borderColor: colors.background,
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
