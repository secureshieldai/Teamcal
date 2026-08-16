import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { GAMES, TOURNAMENTS } from '../../data/gamesData';
import { personalService } from '../../services/api/personal.service';

export default function GamesTab() {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    personalService.list('followed-game').then((rows) => setFollowedIds(new Set(rows.map((r) => r.external_key || '')))).catch(() => {});
  }, []);

  const toggleFollow = async (gameId: string) => {
    const wasFollowed = followedIds.has(gameId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (wasFollowed) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
    try {
      const active = await personalService.toggle('followed-game', gameId, {});
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (active) next.add(gameId);
        else next.delete(gameId);
        return next;
      });
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (wasFollowed) next.add(gameId);
        else next.delete(gameId);
        return next;
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Games Discussions</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameRow}>
        {GAMES.map((game) => {
          const following = followedIds.has(game.id);
          return (
            <TouchableOpacity key={game.id} style={styles.gameTile} activeOpacity={0.85} onPress={() => toggleFollow(game.id)}>
              <View>
                <Image source={{ uri: game.thumbnail }} style={styles.gameThumb} />
                {following && (
                  <View style={styles.followingBadge}>
                    <Text style={styles.followingBadgeText}>Following</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gameName} numberOfLines={1}>{game.name}</Text>
              <Text style={styles.gamePosts}>{game.newPosts} new posts</Text>
              <View style={styles.avatarStack}>
                {game.participantAvatars.map((seed, i) => (
                  <Image key={seed} source={{ uri: `https://picsum.photos/seed/${seed}/60/60` }} style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -8 }]} />
                ))}
                <Text style={styles.stackExtra}>+{game.extraParticipants}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Ongoing Tournaments</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>
      {TOURNAMENTS.map((t) => (
        <View key={t.id} style={[styles.tournamentRow, shadow.soft]}>
          <Image source={{ uri: t.gameThumbnail }} style={styles.tournamentThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tournamentName} numberOfLines={1}>{t.name}</Text>
            <Text style={styles.tournamentMeta}>{t.type}</Text>
            <Text style={styles.tournamentMeta}>{t.playersLabel}</Text>
          </View>
          {t.live && (
            <View style={styles.liveNowPill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveNowText}>Live Now</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  gameRow: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  gameTile: {
    width: 128,
  },
  gameThumb: {
    width: 128,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  followingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  followingBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  gameName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  gamePosts: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stackAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.card,
    backgroundColor: colors.border,
  },
  stackExtra: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 4,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tournamentThumb: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  tournamentName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tournamentMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  liveNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDE3',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveNowText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
  },
});
