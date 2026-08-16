import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { personalService } from '../../services/api/personal.service';

export type BlogCardPost = {
  id: string;
  image: string;
  title: string;
  author: string;
  date: string;
  readMinutes: number;
  excerpt: string;
  views: number;
  commentCount: number;
};

type Props = {
  post: BlogCardPost;
  onPressSeeAll?: () => void;
};

export default function BlogCard({ post, onPressSeeAll }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    personalService.list('saved-blog').then((rows) => setSaved(rows.some((r) => r.external_key === post.id))).catch(() => {});
  }, [post.id]);

  const toggleSaved = async () => {
    const previous = saved;
    setSaved(!saved);
    try {
      setSaved(await personalService.toggle('saved-blog', post.id, { title: post.title, image: post.image }));
    } catch {
      setSaved(previous);
    }
  };

  return (
    <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.9} onPress={onPressSeeAll}>
      <Image source={{ uri: post.image }} style={styles.cover} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.meta}>{post.author} • {post.date}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>{post.excerpt}</Text>
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerItem}>
              <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
              <Text style={styles.footerText}>{post.views.toLocaleString()} views</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
              <Text style={styles.footerText}>{post.commentCount}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleSaved} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cover: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  meta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  excerpt: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
