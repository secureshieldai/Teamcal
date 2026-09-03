import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import StoriesRow from '../../components/StoriesRow';
import StoryComposer from '../../components/social/StoryComposer';
import PostCard, { type Post as FeedPost } from '../../components/PostCard';
import SegmentedControl from '../../components/SegmentedControl';
import BlogCard from '../../components/social/BlogCard';
import AIAssistantModal from '../../components/social/AIAssistantModal';
import VideoFeedTab from './VideoFeedTab';
import SocialGamesTab from './SocialGamesTab';
import SocialLiveTab from './SocialLiveTab';
import SocialEventsTab from './SocialEventsTab';
import type { VideoFeedItem } from '../../components/social/VideoFeedCard';
import { colors, radii, spacing } from '../../theme';
import { feedSubTabs } from '../../data/communityData';
import { useCreatePost, useFeed } from '../../hooks/useCommunity';
import type { RootStackParamList } from '../../navigation/types';
import {useApiQuery} from '../../hooks/useApiQuery';
import {socialService} from '../../services/api/social.service';
import {postsService} from '../../services/api/posts.service';
import {useAuth} from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  initialSubTab?: string;
};

export default function SocialFeedTab({ navigation, initialSubTab }: Props) {
  const [subTab, setSubTab] = useState(initialSubTab ?? feedSubTabs[0]);
  const { posts, loading: feedLoading, error: feedError, refetch } = useFeed();
  const { createPost, loading: posting } = useCreatePost();
  const [draft, setDraft] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [storyLikes, setStoryLikes] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [storyReply, setStoryReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const insets = useSafeAreaInsets();
  const {user}=useAuth();
  const socialBlogs=useApiQuery(()=>socialService.getSocialBlogs(),[],[]);
  const socialVideos=useApiQuery(()=>socialService.getSocialVideos(),[],[]);
  const socialStories=useApiQuery(()=>socialService.getStories(),[],[]);
  const blogCards=socialBlogs.data.map((item)=>({
    id:item.id,
    image:item.cover||'',
    title:item.title,
    author:item.user?.name||'Creator',
    date:new Date(item.created_at).toLocaleDateString([],{month:'short',day:'numeric'}),
    readMinutes:item.read_minutes||1,
    excerpt:item.body?item.body.replace(/\s+/g,' ').trim().slice(0,140):'',
    views:item.views||0,
    commentCount:0,
  }));
  const videoCards:VideoFeedItem[]=socialVideos.data.map((item)=>({
    id:item.id,
    thumbnail:item.image||item.metadata?.thumbnailUrl||'',
    authorId:item.user?.id||'',
    author:item.user?.name||'Creator',
    authorAvatar:item.user?.avatar||'',
    verified:item.user?.verified,
    time:new Date(item.created_at).toLocaleDateString(),
    duration:String(item.metadata?.duration||'0:00'),
    caption:item.description||item.title||'',
    likes:item.metrics?.likes||0,
    comments:item.metrics?.comments||0,
    videoUrl:item.metadata?.fileUrl||item.video||'',
  }));
  const storyCards=socialStories.data.map(item=>({id:item.id,label:item.user?.name||'Creator',avatar:item.image}));
  const activeStory=activeStoryId ? socialStories.data.find(item=>item.id===activeStoryId) : undefined;
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Instagram-style pull-to-refresh: swipe down at the top of the feed to reload.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), socialStories.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  const renderPost = useCallback(({ item }: { item: FeedPost }) => (
    <PostCard
      post={item}
      onComment={(postId) => navigation.navigate('Comments', { postId })}
      onPressAuthor={item.authorId ? () => {
        navigation.navigate('UserProfile', { userId: item.authorId!, username: item.authorName });
      } : undefined}
    />
  ), [navigation]);

  // Reset transient reply/like UI whenever a different story opens.
  useEffect(() => {
    if (!activeStory) return;
    setStoryLikes(prev => prev[activeStory.id] ? prev : { ...prev, [activeStory.id]: { liked: activeStory.liked, likes: activeStory.likes } });
    setStoryReply('');
    setReplySent(false);
  }, [activeStoryId]);

  const activeStoryLike = activeStory ? storyLikes[activeStory.id] ?? { liked: activeStory.liked, likes: activeStory.likes } : { liked: false, likes: 0 };

  const toggleStoryLike = async () => {
    if (!activeStory) return;
    const prev = activeStoryLike;
    const optimistic = { liked: !prev.liked, likes: prev.likes + (prev.liked ? -1 : 1) };
    setStoryLikes(s => ({ ...s, [activeStory.id]: optimistic }));
    try {
      const result = await postsService.toggleLike(activeStory.id);
      setStoryLikes(s => ({ ...s, [activeStory.id]: { liked: result.liked, likes: result.likes } }));
    } catch (e) {
      setStoryLikes(s => ({ ...s, [activeStory.id]: prev }));
      Alert.alert('Unable to like story', (e as Error).message);
    }
  };

  const sendStoryReply = async () => {
    if (!activeStory || !storyReply.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      await postsService.addComment(activeStory.id, storyReply.trim());
      setStoryReply('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch (e) {
      Alert.alert('Unable to send reply', (e as Error).message);
    } finally {
      setSendingReply(false);
    }
  };

  // useApiQuery already polls every 15s on its own; refetch on focus for an immediate refresh.
  useFocusEffect(useCallback(() => {
    refetch();
    socialStories.refetch();
  }, [refetch]));

  const chooseImages = async () => {
    const remaining = 10 - selectedImages.length;
    if (!remaining) return Alert.alert('Image limit reached', 'You can attach up to 10 images.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: .8 });
    if (!result.canceled) setSelectedImages(current => [...current, ...result.assets].slice(0, 10));
  };
  
  const chooseVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['videos'], 
      allowsEditing: false,
      quality: 1
    });
    if (!result.canceled) {
      setSelectedVideo(result.assets[0]);
      setSelectedImages([]); // Clear images when video is selected
    }
  };
  const moveImage = (index: number, direction: -1 | 1) => setSelectedImages(current => {
    const next = [...current];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const publish = async () => {
    if (!draft.trim() && !selectedImages.length && !selectedVideo) return;
    try {
      console.log('Publishing post with', selectedImages.length, 'images and', selectedVideo ? '1 video' : 'no video');
      
      let imageUrls: string[] = [];
      let videoUrl: string | undefined;
      
      if (selectedVideo) {
        console.log('Uploading video:', selectedVideo.uri.substring(0, 60));
        videoUrl = await postsService.uploadVideo({ 
          uri: selectedVideo.uri, 
          mimeType: selectedVideo.mimeType || 'video/mp4', 
          fileName: selectedVideo.fileName || 'video.mp4' 
        });
        console.log('Video uploaded, URL:', videoUrl);
      } else if (selectedImages.length) {
        imageUrls = await Promise.all(selectedImages.map(async (asset, index) => {
          console.log(`Uploading image ${index + 1}/${selectedImages.length}:`, asset.uri.substring(0, 60));
          const url = await postsService.uploadImage({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName });
          console.log(`Image ${index + 1} uploaded, URL:`, url);
          return url;
        }));
        console.log('All images uploaded, URLs:', imageUrls);
      }
      
      await createPost(draft.trim(), imageUrls, videoUrl);
      setDraft('');
      setSelectedImages([]);
      setSelectedVideo(null);
      await refetch();
    } catch (e) {
      console.error('Error publishing post:', e);
      Alert.alert('Unable to post', (e as Error).message);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.storiesWrap}>
        <StoriesRow
          currentUserAvatar={user?.avatar||''}
          stories={storyCards}
          onAddStory={() => setStoryComposerOpen(true)}
          onPressStory={setActiveStoryId}
          onPressYou={user?.id ? () => navigation.navigate('UserProfile', { userId: user.id, username: user.name ?? 'You' }) : undefined}
        />
      </View>

      <View style={styles.subTabsWrap}>
        <SegmentedControl options={feedSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
      </View>

      {subTab === 'Blogs' ? (
        <FlatList
          data={blogCards}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={11}
          refreshControl={
            <RefreshControl
              refreshing={socialBlogs.loading}
              onRefresh={socialBlogs.refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <BlogCard post={item} onPressSeeAll={() => navigation.navigate('BlogDetail', { blogId: item.id })} />
          )}
        />
      ) : subTab === 'Videos' ? (
        <VideoFeedTab videos={videoCards} loading={socialVideos.loading} />
      ) : subTab === 'Games' ? (
        <SocialGamesTab />
      ) : subTab === 'Live' ? (
        <SocialLiveTab />
      ) : subTab === 'Events' ? (
        <SocialEventsTab />
      ) : (
        <FlatList
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={renderPost}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReachedThreshold={0.5}
            removeClippedSubviews
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={11}
            updateCellsBatchingPeriod={50}
            ItemSeparatorComponent={null}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {feedLoading ? 'Loading posts…' : feedError ? `Unable to load posts: ${feedError}` : 'No posts yet. Share the first update.'}
              </Text>
            }
            ListHeaderComponent={
              <View style={styles.composerWrap}>
                <View style={styles.composer}>
                <TextInput
                  style={styles.composerInput}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Share an update…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                {selectedImages.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
                  {selectedImages.map((asset, index) => <View key={`${asset.uri}-${index}`} style={styles.previewWrap}>
                    <Image source={{ uri: asset.uri }} style={styles.preview} />
                    <TouchableOpacity accessibilityLabel={`Remove image ${index + 1}`} style={styles.removeImage} onPress={() => setSelectedImages(current => current.filter((_, i) => i !== index))}>
                      <Ionicons name="close" size={15} color={colors.white} />
                    </TouchableOpacity>
                    <View style={styles.reorderButtons}>
                      {index > 0 && <TouchableOpacity accessibilityLabel="Move image left" onPress={() => moveImage(index, -1)}><Ionicons name="chevron-back-circle" size={22} color={colors.white} /></TouchableOpacity>}
                      {index < selectedImages.length - 1 && <TouchableOpacity accessibilityLabel="Move image right" onPress={() => moveImage(index, 1)}><Ionicons name="chevron-forward-circle" size={22} color={colors.white} /></TouchableOpacity>}
                    </View>
                  </View>)}
                </ScrollView> : null}
                {selectedVideo ? <View style={styles.videoPreviewWrap}>
                  <View style={styles.videoPreview}>
                    <Ionicons name="videocam" size={32} color={colors.white} />
                    <Text style={styles.videoName} numberOfLines={1}>{selectedVideo.fileName || 'Video selected'}</Text>
                    {selectedVideo.duration && <Text style={styles.videoDuration}>{Math.floor(selectedVideo.duration)}s</Text>}
                  </View>
                  <TouchableOpacity accessibilityLabel="Remove video" style={styles.removeVideo} onPress={() => setSelectedVideo(null)}>
                    <Ionicons name="close" size={15} color={colors.white} />
                  </TouchableOpacity>
                </View> : null}
                <View style={styles.composerActions}>
                  <View style={styles.composerButtonGroup}>
                    <TouchableOpacity accessibilityLabel="AI Assistant" style={styles.pillButton} onPress={() => setAiModalOpen(true)} disabled={posting}>
                      <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                      <Text style={styles.pillButtonText}>AI Assistant</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="Add images" style={styles.pillButton} onPress={chooseImages} disabled={posting || !!selectedVideo}>
                      <Ionicons name="image-outline" size={16} color={colors.primary} />
                      <Text style={styles.pillButtonText}>Image</Text>
                      {selectedImages.length ? <Text style={styles.imageCount}>{selectedImages.length}/10</Text> : null}
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="Add video" style={styles.pillButton} onPress={chooseVideo} disabled={posting || selectedImages.length > 0}>
                      <Ionicons name="videocam-outline" size={16} color={colors.primary} />
                      <Text style={styles.pillButtonText}>Video</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.postButton} onPress={publish} disabled={posting || (!draft.trim() && !selectedImages.length && !selectedVideo)}>
                    <Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </View>
            }
          />
      )}

      <AIAssistantModal
        visible={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onUseCaption={(caption) => setDraft((prev) => (prev.trim() ? `${prev}\n${caption}` : caption))}
      />

      <Modal visible={Boolean(activeStory)} animationType="fade" transparent onRequestClose={() => setActiveStoryId(null)}>
        <KeyboardAvoidingView style={styles.storyViewer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.storyHeader}>
            <TouchableOpacity
              style={styles.storyAuthorTouchable}
              disabled={!activeStory?.user?.id}
              onPress={() => {
                if (!activeStory?.user?.id) return;
                const { id, name } = activeStory.user;
                setActiveStoryId(null);
                navigation.navigate('UserProfile', { userId: id, username: name || 'Member' });
              }}
            >
              <Image source={{ uri: activeStory?.user?.avatar || activeStory?.image }} style={styles.storyAvatar} />
              <Text style={styles.storyAuthor} numberOfLines={1}>{activeStory?.user?.name || 'Story'}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Close story" onPress={() => setActiveStoryId(null)} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
          </View>
          {activeStory?.image ? <Image source={{ uri: activeStory.image }} style={styles.storyImage} resizeMode="contain" /> : null}

          {activeStory && (
            <View style={[styles.storyReplyBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
              {replySent ? (
                <View style={styles.storyReplySentPill}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.white} />
                  <Text style={styles.storyReplySentText}>Reply sent</Text>
                </View>
              ) : (
                <View style={styles.storyReplyRow}>
                  <TextInput
                    style={styles.storyReplyInput}
                    value={storyReply}
                    onChangeText={setStoryReply}
                    placeholder={`Reply to ${activeStory.user?.name || 'this story'}…`}
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    onSubmitEditing={sendStoryReply}
                    returnKeyType="send"
                  />
                  {storyReply.trim().length > 0 && (
                    <TouchableOpacity accessibilityLabel="Send reply" onPress={sendStoryReply} disabled={sendingReply} style={styles.storySendBtn}>
                      {sendingReply ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={17} color={colors.white} />}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity accessibilityLabel={activeStoryLike.liked ? 'Unlike story' : 'Like story'} onPress={toggleStoryLike} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.storyLikeBtn}>
                    <Ionicons name={activeStoryLike.liked ? 'heart' : 'heart-outline'} size={26} color={activeStoryLike.liked ? colors.primary : colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      <StoryComposer
        visible={storyComposerOpen}
        onClose={() => setStoryComposerOpen(false)}
        onPosted={() => socialStories.refetch()}
      />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  composerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  composerInput: {
    minHeight: 64,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-end',
  },
  composerActions: { flexDirection: 'column', gap: spacing.sm, marginTop: spacing.sm },
  composerButtonGroup: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pillButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pillButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  imageCount: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  previewRow: { gap: spacing.sm, paddingBottom: spacing.sm, marginTop: spacing.sm },
  previewWrap: { width: 92, height: 92, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.border },
  preview: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', right: 4, top: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.65)', padding: 2 },
  reorderButtons: { position: 'absolute', left: 4, right: 4, bottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
  videoPreviewWrap: { marginTop: spacing.sm, borderRadius: radii.lg, overflow: 'hidden' },
  videoPreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.navy, padding: spacing.md, borderRadius: radii.lg },
  videoName: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },
  videoDuration: { color: colors.white, fontSize: 11, fontWeight: '600', opacity: 0.8 },
  removeVideo: { position: 'absolute', right: 8, top: 8, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.65)', padding: 2 },
  postText: {
    color: colors.white,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  storyViewer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  storyHeader: { position: 'absolute', zIndex: 1, top: 48, left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storyAuthorTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  storyAuthor: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '700' },
  storyImage: { width: '100%', height: '100%' },
  storyReplyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  storyReplyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storyReplyInput: {
    flex: 1, color: colors.white, fontSize: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  storySendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  storyLikeBtn: { padding: 2 },
  storyReplySentPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.pill, paddingVertical: 10,
  },
  storyReplySentText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
