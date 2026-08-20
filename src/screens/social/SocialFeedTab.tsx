import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import StoriesRow from '../../components/StoriesRow';
import PostCard from '../../components/PostCard';
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
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
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
    thumbnail:item.image||'',
    authorId:item.user?.id||'',
    author:item.user?.name||'Creator',
    authorAvatar:item.user?.avatar||'',
    verified:item.user?.verified,
    time:new Date(item.created_at).toLocaleDateString(),
    duration:String(item.metadata?.duration||'0:00'),
    caption:item.description||item.title,
    likes:item.metrics?.likes||0,
    comments:item.metrics?.comments||0,
  }));
  const storyCards=socialStories.data.map(item=>({id:item.id,label:item.user?.name||'Creator',avatar:item.image}));
  const activeStory=activeStoryId ? socialStories.data.find(item=>item.id===activeStoryId) : undefined;
  const addStory=async()=>{try{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.8});if(result.canceled)return;const asset=result.assets[0];const url=await postsService.uploadImage({uri:asset.uri,mimeType:asset.mimeType,fileName:asset.fileName});await postsService.create({text:'',image:url,community:'story'});await socialStories.refetch();}catch(e){Alert.alert('Unable to add story',(e as Error).message);}};

  useFocusEffect(useCallback(() => {
    refetch();
  }, [refetch]));

  const chooseImages = async () => {
    const remaining = 10 - selectedImages.length;
    if (!remaining) return Alert.alert('Image limit reached', 'You can attach up to 10 images.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: .8 });
    if (!result.canceled) setSelectedImages(current => [...current, ...result.assets].slice(0, 10));
  };
  const moveImage = (index: number, direction: -1 | 1) => setSelectedImages(current => {
    const next = [...current];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const publish = async () => {
    if (!draft.trim() && !selectedImages.length) return;
    try {
      const imageUrls = await Promise.all(selectedImages.map(asset => postsService.uploadImage({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName })));
      await createPost(draft.trim(), imageUrls);
      setDraft('');
      setSelectedImages([]);
      await refetch();
    } catch (e) {
      Alert.alert('Unable to post', (e as Error).message);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.storiesWrap}>
        <StoriesRow currentUserAvatar={user?.avatar||''} stories={storyCards} onAddStory={addStory} onPressStory={setActiveStoryId} />
      </View>

      <View style={styles.subTabsWrap}>
        <SegmentedControl options={feedSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
      </View>

      {subTab === 'Blogs' ? (
        <FlatList
          data={blogCards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
              <View style={styles.composerActions}>
                <View style={styles.composerButtonGroup}>
                  <TouchableOpacity accessibilityLabel="AI Assistant" style={styles.pillButton} onPress={() => setAiModalOpen(true)} disabled={posting}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                    <Text style={styles.pillButtonText}>AI Assistant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityLabel="Add images" style={styles.pillButton} onPress={chooseImages} disabled={posting}>
                    <Ionicons name="image-outline" size={16} color={colors.primary} />
                    <Text style={styles.pillButtonText}>Image</Text>
                    {selectedImages.length ? <Text style={styles.imageCount}>{selectedImages.length}/10</Text> : null}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.postButton} onPress={publish} disabled={posting || (!draft.trim() && !selectedImages.length)}>
                  <Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text>
                </TouchableOpacity>
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
        <View style={styles.storyViewer}>
          <View style={styles.storyHeader}>
            <Image source={{ uri: activeStory?.user?.avatar || activeStory?.image }} style={styles.storyAvatar} />
            <Text style={styles.storyAuthor} numberOfLines={1}>{activeStory?.user?.name || 'Story'}</Text>
            <TouchableOpacity accessibilityLabel="Close story" onPress={() => setActiveStoryId(null)} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
          </View>
          {activeStory?.image ? <Image source={{ uri: activeStory.image }} style={styles.storyImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
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
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  composerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  composerButtonGroup: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  pillButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pillButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  imageCount: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  previewRow: { gap: spacing.sm, paddingBottom: spacing.sm, marginTop: spacing.sm },
  previewWrap: { width: 92, height: 92, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.border },
  preview: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', right: 4, top: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.65)', padding: 2 },
  reorderButtons: { position: 'absolute', left: 4, right: 4, bottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
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
  storyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  storyAuthor: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '700' },
  storyImage: { width: '100%', height: '100%' },
});
