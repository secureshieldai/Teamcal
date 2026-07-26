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
            <Ionicons name={item.icon} size={18} color={colors.primary} />
          </View>
          <Text style={styles.chipLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function MacroDial({ value, label }: { value: string; label: string }) {
  const badges: { icon: IconName; label: string }[] = [
    { icon: 'flame-outline', label: 'Macros' },
    { icon: 'water-outline', label: 'Water' },
    { icon: 'moon-outline', label: 'Fasting' },
    { icon: 'scale-outline', label: 'Weight' },
    { icon: 'restaurant-outline', label: 'Meals' },
    { icon: 'bed-outline', label: 'Sleep' },
  ];

  return (
    <View style={styles.dialWrap}>
      <View style={styles.dialRing}>
        <Text style={styles.dialValue}>{value}</Text>
        <Text style={styles.dialLabel}>{label}</Text>
      </View>
      <View style={styles.dialGrid}>
        {badges.map((badge) => (
          <View key={badge.label} style={styles.dialBadge}>
            <Ionicons name={badge.icon} size={14} color={colors.primary} />
            <Text style={styles.dialBadgeLabel}>{badge.label}</Text>
          </View>
        ))}
      </View>
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

export function GroupCard({ members }: { members: string[] }) {
  return (
    <View style={styles.groupWrap}>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.groupTitle}>Stronger Together</Text>
        <Text style={styles.groupSubtitle}>12 Members</Text>
        <View style={styles.avatarStack}>
          {members.slice(0, 4).map((uri, i) => (
            <View key={uri} style={[styles.avatarStackItem, { marginLeft: i === 0 ? 0 : -14 }]}>
              <Avatar uri={uri} size={36} />
            </View>
          ))}
          <View style={[styles.avatarStackMore, { marginLeft: -14 }]}>
            <Text style={styles.avatarStackMoreText}>+8</Text>
          </View>
        </View>
      </View>
      <View style={[styles.card, shadow.card, { marginTop: spacing.md }]}>
        {[
          { icon: 'person-add-outline' as IconName, label: 'Invite Friends' },
          { icon: 'people-circle-outline' as IconName, label: 'Create Team' },
          { icon: 'enter-outline' as IconName, label: 'Join a Group' },
          { icon: 'chatbox-ellipses-outline' as IconName, label: 'Team Chat' },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.listRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.listIcon}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
            </View>
            <Text style={styles.listLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MarketplaceIllustration({ categories }: { categories: { icon: IconName; label: string }[] }) {
  return (
    <View style={{ width: '100%' }}>
      <View style={styles.marketGrid}>
        {categories.map((cat) => (
          <View key={cat.label} style={styles.marketItem}>
            <View style={styles.chipIcon}>
              <Ionicons name={cat.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.chipLabel}>{cat.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.promoBanner}>
        <Text style={styles.promoTitle}>30-Day Team{'\n'}Challenge Pack</Text>
        <View style={styles.promoButton}>
          <Text style={styles.promoButtonText}>Shop Now</Text>
        </View>
      </View>
    </View>
  );
}

export function RewardsIllustration({ points, items }: { points: string; items: { label: string; points: string }[] }) {
  return (
    <View style={{ width: '100%' }}>
      <View style={styles.pointsCard}>
        <View>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={26} color={colors.primary} />
        </View>
      </View>
      <View style={[styles.card, shadow.card, { marginTop: spacing.md }]}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.listRow, i === items.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[styles.listLabel, { marginLeft: 0 }]}>{item.label}</Text>
            <Text style={styles.rewardPoints}>{item.points}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function InviteIllustration({ photo, code }: { photo: string; code: string }) {
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Image source={{ uri: photo }} style={[styles.photo, { height: 160 }]} />
      <View style={[styles.card, shadow.card, styles.inviteCard]}>
        <Text style={styles.inviteLabel}>Your Invite Code</Text>
        <View style={styles.inviteCodeRow}>
          <Text style={styles.inviteCode}>{code}</Text>
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

export function ShieldGraphic() {
  return (
    <View style={styles.shieldWrap}>
      <View style={styles.shieldCircle}>
        <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
      </View>
      <View style={styles.shieldBanner}>
        <Text style={styles.shieldBannerText}>TEAMCAL</Text>
      </View>
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
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  chip: {
    alignItems: 'center',
    width: 76,
  },
  chipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dialWrap: {
    alignItems: 'center',
    width: '100%',
  },
  dialRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: colors.ringTrack,
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotateZ: '0deg' }],
  },
  dialValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dialLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    width: '30%',
    justifyContent: 'center',
  },
  dialBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
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
  groupWrap: {
    width: '100%',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  groupSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: colors.card,
    borderRadius: 20,
  },
  avatarStackMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarStackMoreText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  marketItem: {
    alignItems: 'center',
    width: 72,
  },
  promoBanner: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  promoButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  promoButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  pointsCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  pointsBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  inviteCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 2,
  },
  shieldWrap: {
    alignItems: 'center',
  },
  shieldCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldBanner: {
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: -spacing.md,
  },
  shieldBannerText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 13,
  },
});
