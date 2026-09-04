import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import PostCard, { type Post } from '../../components/PostCard';
import SegmentedControl from '../../components/SegmentedControl';
import { colors, radii, spacing, typography } from '../../theme';
import { meSubTabs } from '../../data/communityData';
import { useFeed, useMyPosts } from '../../hooks/useCommunity';
import { useProfile } from '../../hooks/useProfile';
import type { RootStackParamList } from '../../navigation/types';
import { personalService } from '../../services/api/personal.service';
import {postsService} from '../../services/api/posts.service';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  headerComponent?: React.ReactNode;
};

function useSavedPosts(candidates: Post[]) {
  const [saved, setSaved] = useState<Post[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const records=await personalService.list('saved-post');
      const keys=new Set(records.map(r=>r.external_key));
      if (!cancelled) setSaved(candidates.filter(p=>keys.has(p.id)));
    })();
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  return saved;
}

export default function SocialMeTab({ navigation, headerComponent }: Props) {
  const [subTab, setSubTab] = useState(meSubTabs[0]);
  const { profileUser, profileStats } = useProfile();
  const { posts: myPosts, loading: myPostsLoading, error: myPostsError,refetch } = useMyPosts();
  const { posts: feedPosts } = useFeed();
  const candidates = useMemo(() => [...myPosts, ...feedPosts], [myPosts, feedPosts]);
  const savedPosts = useSavedPosts(candidates);
  const taggedPosts=useMemo(()=>{const tags=[profileUser.handle,`@${(profileUser.name||'').replace(/\s+/g,'')}`].filter(Boolean).map(x=>x.toLowerCase());return feedPosts.filter(post=>tags.some(tag=>post.caption.toLowerCase().includes(tag)));},[feedPosts,profileUser.handle,profileUser.name]);

  const following = profileStats.find((s) => s.label === 'Following')?.value ?? '0';
  const followers = profileStats.find((s) => s.label === 'Followers')?.value ?? '0';

  const data = subTab === 'Saved' ? savedPosts : subTab === 'Posts' ? myPosts : taggedPosts;
  const emptyText =
    subTab === 'Tagged'
      ? "No tagged posts yet."
      : subTab === 'Saved'
      ? "You haven't saved any posts yet."
      : myPostsLoading
      ? 'Loading your posts…'
      : myPostsError
      ? `Unable to load posts: ${myPostsError}`
      : "You haven't posted yet. Go to Profile to share your first post.";

  return (
    <View style={styles.flex}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={
          <>
            {headerComponent}
            <View style={styles.headerCard}>
              <Avatar uri={profileUser.avatar} size={56} />
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{profileUser.name || 'You'}</Text>
                <Text style={styles.handle}>{profileUser.handle}</Text>
                {profileUser.bio ? <Text style={styles.bio}>{profileUser.bio}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myPosts.length}</Text>
                <Text style={styles.statLabel}>POSTS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{following}</Text>
                <Text style={styles.statLabel}>FOLLOWING</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{followers}</Text>
                <Text style={styles.statLabel}>FOLLOWERS</Text>
              </View>
            </View>

            <View style={styles.subTabsWrap}>
              <SegmentedControl options={meSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        renderItem={({ item }) => <PostCard post={item} onComment={(postId) => navigation.navigate('Comments', { postId })} onDelete={async id=>{await postsService.delete(id);await refetch();}} onPressAuthor={item.authorId ? () => navigation.navigate('UserProfile', { userId: item.authorId!, username: item.authorName }) : undefined} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  edit: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  subTabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  list: {
    padding: spacing.lg,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
