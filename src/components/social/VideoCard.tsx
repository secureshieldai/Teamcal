import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, radii, spacing } from '../../theme';

export type VideoCardItem = {id:string;thumbnail:string;title:string;author:string;authorAvatar:string;time:string;duration:string;views:string;likes:number;comments:number;caption:string;hero?:boolean};

export default function VideoCard({ video }: { video: VideoCardItem }) {
  if (video.hero) {
    return (
      <View style={[styles.heroCard]}>
        <View style={styles.heroHeader}>
          <Avatar uri={video.authorAvatar} size={32} />
          <View style={styles.heroHeaderInfo}>
            <View style={styles.heroAuthorRow}>
              <Text style={styles.heroAuthor}>{video.author}</Text>
              <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            </View>
            <Text style={styles.heroTime}>{video.time}</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
        </View>

        <View style={styles.heroMediaWrap}>
          <Image source={{ uri: video.thumbnail }} style={styles.heroMedia} />
          <View style={styles.playCircle}>
            <Ionicons name="play" size={22} color={colors.white} />
          </View>

          <View style={styles.heroActions}>
            <View style={styles.heroActionItem}>
              <Ionicons name="heart" size={22} color={colors.white} />
              <Text style={styles.heroActionText}>{video.likes}</Text>
            </View>
            <View style={styles.heroActionItem}>
              <Ionicons name="chatbubble" size={20} color={colors.white} />
              <Text style={styles.heroActionText}>{video.comments}</Text>
            </View>
            <Ionicons name="share-social" size={21} color={colors.white} style={{ marginBottom: spacing.sm }} />
            <Ionicons name="bookmark-outline" size={21} color={colors.white} />
          </View>

          <View style={styles.captionWrap}>
            <Text style={styles.captionText} numberOfLines={2}>{video.caption}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.listRow} activeOpacity={0.85}>
      <View style={styles.listThumbWrap}>
        <Image source={{ uri: video.thumbnail }} style={styles.listThumb} />
        <Ionicons name="play-circle" size={26} color={colors.white} style={styles.listPlayIcon} />
        <View style={styles.listDurationBadge}>
          <Text style={styles.listDurationText}>{video.duration}</Text>
        </View>
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.listAuthor}>{video.author}</Text>
        <Text style={styles.listMeta}>{video.views ? `${video.views} • ` : ''}{video.time}</Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroHeaderInfo: {
    flex: 1,
  },
  heroAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroAuthor: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  heroTime: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 1,
  },
  heroMediaWrap: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: colors.navyLight,
  },
  heroMedia: {
    width: '100%',
    height: '100%',
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -28,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xxl + spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  heroActionItem: {
    alignItems: 'center',
    gap: 2,
  },
  heroActionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  captionWrap: {
    position: 'absolute',
    left: spacing.md,
    right: 56,
    bottom: spacing.md,
  },
  captionText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  durationText: {
    color: colors.white,
    fontSize: 10.5,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  listThumbWrap: {
    width: 96,
    height: 68,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  listPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -13,
    marginLeft: -13,
  },
  listDurationBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  listDurationText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: '700',
  },
  listBody: {
    flex: 1,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  listAuthor: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
  listMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
