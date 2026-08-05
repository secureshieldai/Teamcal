import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';

export type BlogCardPost = { id:string; image:string; title:string; author:string; readMinutes:number; featured?:boolean };

type Props = {
  post: BlogCardPost;
  onPressSeeAll?: () => void;
};

export default function BlogCard({ post, onPressSeeAll }: Props) {
  if (post.featured) {
    return (
      <TouchableOpacity style={[styles.featuredCard, shadow.card]} activeOpacity={0.9} onPress={onPressSeeAll}>
        <Image source={{ uri: post.image }} style={styles.featuredImage} />
        <View style={styles.featuredBody}>
          <Text style={styles.featuredTitle}>{post.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.author}>{post.author}</Text>
            <Text style={styles.readTime}>{'•'} {post.readMinutes} min read</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPressSeeAll}>
      <Image source={{ uri: post.image }} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>{post.title}</Text>
        <View style={styles.rowFooter}>
          <View>
            <Text style={styles.author}>{post.author}</Text>
            <Text style={styles.readTime}>{post.readMinutes} min read</Text>
          </View>
          <Text style={styles.seeAll}>See All ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  featuredBody: {
    padding: spacing.md,
  },
  featuredTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  rowBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  author: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  readTime: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
