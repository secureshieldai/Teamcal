import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StoriesRow from '../../components/StoriesRow';
import PostCard from '../../components/PostCard';
import SegmentedControl from '../../components/SegmentedControl';
import BlogCard from '../../components/social/BlogCard';
import VideoCard from '../../components/social/VideoCard';
import { colors, radii, spacing } from '../../theme';
import { feedSubTabs } from '../../data/communityData';
import { currentUser, stories } from '../../data/homeData';
import { mockBlogPosts, mockVideos } from '../../data/socialMockData';
import { useCreatePost, useFeed } from '../../hooks/useCommunity';
import type { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function SocialFeedTab({ navigation }: Props) {
  const [subTab, setSubTab] = useState(feedSubTabs[0]);
  const { posts, loading: feedLoading, error: feedError, refetch } = useFeed();
  const { createPost, loading: posting } = useCreatePost();
  const [draft, setDraft] = useState('');

  const publish = async () => {
    if (!draft.trim()) return;
    try {
      await createPost(draft.trim());
      setDraft('');
      await refetch();
    } catch (e) {
      Alert.alert('Unable to post', (e as Error).message);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.storiesWrap}>
        <StoriesRow currentUserAvatar={currentUser.avatar} stories={stories} />
      </View>

      <View style={styles.subTabsWrap}>
        <SegmentedControl options={feedSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
      </View>

      {subTab === 'Blogs' ? (
        <FlatList
          data={mockBlogPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlogCard post={item} onPressSeeAll={() => navigation.navigate('BlogDetail', { blogId: item.id })} />
          )}
        />
      ) : subTab === 'Videos' ? (
        <FlatList
          data={mockVideos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <VideoCard video={item} />}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onComment={(postId) => navigation.navigate('Comments', { postId })} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {feedLoading ? 'Loading posts…' : feedError ? `Unable to load posts: ${feedError}` : 'No posts yet. Share the first update.'}
            </Text>
          }
          ListHeaderComponent={
            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Share an update…"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity style={styles.postButton} onPress={publish} disabled={posting}>
                <Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  storiesWrap: {
    marginTop: spacing.md,
  },
  subTabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
  },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  composerInput: {
    minHeight: 64,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  postButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  postText: {
    color: colors.white,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
