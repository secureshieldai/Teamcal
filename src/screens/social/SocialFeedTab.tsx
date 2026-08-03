import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StoriesRow from '../../components/StoriesRow';
import PostCard from '../../components/PostCard';
import SegmentedControl from '../../components/SegmentedControl';
import BlogCard from '../../components/social/BlogCard';
import VideoCard from '../../components/social/VideoCard';
import { colors, radii, spacing } from '../../theme';
import { feedSubTabs, posts as showcasePosts } from '../../data/communityData';
import {mockBlogPosts, mockVideos} from '../../data/socialMockData';
import { currentUser } from '../../data/homeData';
import { useCreatePost, useFeed } from '../../hooks/useCommunity';
import type { RootStackParamList } from '../../navigation/types';
import {useApiQuery} from '../../hooks/useApiQuery';
import {socialService} from '../../services/api/social.service';
import {postsService} from '../../services/api/posts.service';
import {useAuth} from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function SocialFeedTab({ navigation }: Props) {
  const [subTab, setSubTab] = useState(feedSubTabs[0]);
  const { posts, loading: feedLoading, error: feedError, refetch } = useFeed();
  const { createPost, loading: posting } = useCreatePost();
  const [draft, setDraft] = useState('');
  const {user}=useAuth();
  const socialBlogs=useApiQuery(()=>socialService.getSocialBlogs(),[],[]);
  const socialVideos=useApiQuery(()=>socialService.getSocialVideos(),[],[]);
  const socialStories=useApiQuery(()=>socialService.getStories(),[],[]);
  const blogCards=socialBlogs.data.map((item,index)=>({id:item.id,image:item.cover||`https://picsum.photos/seed/${item.id}/600/400`,title:item.title,category:item.category||'Community',author:item.user?.name||'Creator',authorAvatar:item.user?.avatar||'',authorVerified:item.user?.verified,date:new Date(item.created_at).toLocaleDateString(),readMinutes:item.read_minutes||1,likes:0,commentCount:0,featured:index===0,body:[],comments:[]}));
  const videoCards=socialVideos.data.map((item,index)=>({id:item.id,thumbnail:item.image||`https://picsum.photos/seed/${item.id}/600/400`,title:item.title,author:item.user?.name||'Creator',authorAvatar:item.user?.avatar||'',time:new Date(item.created_at).toLocaleDateString(),duration:String(item.metadata?.duration||'0:00'),views:String(item.metrics?.views||0),likes:item.metrics?.likes||0,comments:item.metrics?.comments||0,caption:item.description||item.title,hero:index===0}));
  const displayedBlogs=[...blogCards,...mockBlogPosts];
  const displayedVideos=[...videoCards,...mockVideos];
  const displayedPosts=[...posts,...showcasePosts];
  const storyCards=socialStories.data.map(item=>({id:item.id,label:item.user?.name||'Creator',avatar:item.user?.avatar||item.image}));
  const addStory=async()=>{try{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.8});if(result.canceled)return;const url=await postsService.uploadImage(result.assets[0].uri);await postsService.create({text:'Shared a story',image:url});await socialStories.refetch();}catch(e){Alert.alert('Unable to add story',(e as Error).message);}};

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
        <StoriesRow currentUserAvatar={user?.avatar||currentUser.avatar} stories={storyCards} onAddStory={addStory} onPressStory={(id)=>{const story=socialStories.data.find(x=>x.id===id);if(story)Alert.alert(story.user?.name||'Story',story.image);}} />
      </View>

      <View style={styles.subTabsWrap}>
        <SegmentedControl options={feedSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
      </View>

      {subTab === 'Blogs' ? (
        <FlatList
          data={displayedBlogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlogCard post={item} onPressSeeAll={() => navigation.navigate('BlogDetail', { blogId: item.id })} />
          )}
        />
      ) : subTab === 'Videos' ? (
        <FlatList
          data={displayedVideos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <VideoCard video={item} />}
        />
      ) : (
        <FlatList
          data={displayedPosts}
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
