import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { postsService } from '../services/api/posts.service';
import type { PostContentType } from '../types/channels';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChannelPost'>;

export default function CreateChannelPostScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [contentType, setContentType] = useState<PostContentType>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [allowReactions, setAllowReactions] = useState(true);
  const [allowReplies, setAllowReplies] = useState(true);
  const [schedulePost, setSchedulePost] = useState(false);
  const [posting, setPosting] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: contentType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!textContent.trim() && !mediaUri) {
      Alert.alert('Empty Post', 'Please add some content');
      return;
    }

    console.log('[CreateChannelPost] Starting post creation...');
    console.log('[CreateChannelPost] Channel ID:', channelId);
    console.log('[CreateChannelPost] Content Type:', contentType);
    console.log('[CreateChannelPost] Text Content:', textContent.substring(0, 50));
    console.log('[CreateChannelPost] Media URI:', mediaUri?.substring(0, 60));

    setPosting(true);
    try {
      // Upload image/video to server if mediaUri exists
      let uploadedMediaUrl = null;
      if (mediaUri && contentType === 'image') {
        try {
          console.log('[CreateChannelPost] Uploading image...');
          uploadedMediaUrl = await postsService.uploadImage(mediaUri);
          console.log('[CreateChannelPost] Image uploaded:', uploadedMediaUrl?.substring(0, 60));
        } catch (uploadError) {
          console.error('[CreateChannelPost] Image upload error:', uploadError);
          Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
          setPosting(false);
          return;
        }
      } else if (mediaUri && contentType === 'video') {
        try {
          console.log('[CreateChannelPost] Uploading video...');
          uploadedMediaUrl = await postsService.uploadVideo({ uri: mediaUri });
          console.log('[CreateChannelPost] Video uploaded:', uploadedMediaUrl?.substring(0, 60));
        } catch (uploadError) {
          console.error('[CreateChannelPost] Video upload error:', uploadError);
          Alert.alert('Upload Failed', 'Could not upload video. Please try again.');
          setPosting(false);
          return;
        }
      }

      const postData = {
        content_type: contentType,
        text_content: textContent.trim() || null,
        media_url: uploadedMediaUrl,
        is_announcement: false,
      };
      
      console.log('[CreateChannelPost] Creating post with data:', postData);
      const createdPost = await channelsService.createPost(channelId, postData);
      console.log('[CreateChannelPost] Post created successfully:', createdPost?.id);

      Alert.alert('Posted!', 'Your post is live', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('[CreateChannelPost] Error creating post:', error);
      console.error('[CreateChannelPost] Error response:', error.response?.data);
      console.error('[CreateChannelPost] Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create post';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to post in this channel';
      } else if (error.response?.status === 404) {
        errorMessage = 'Channel not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={posting}>
          <Text style={[styles.postBtn, posting && { opacity: 0.5 }]}>{posting ? 'Publishing...' : 'Publish'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.textInput}
          value={textContent}
          onChangeText={setTextContent}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
        />

        <View style={styles.typeRow}>
          {[
            { type: 'text' as PostContentType, icon: 'document-text-outline', label: '' },
            { type: 'image' as PostContentType, icon: 'image-outline', label: '' },
            { type: 'video' as PostContentType, icon: 'videocam-outline', label: '' },
            { type: 'poll' as PostContentType, icon: 'stats-chart-outline', label: '' },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[styles.typeBtn, contentType === item.type && styles.typeBtnActive]}
              onPress={() => {
                setContentType(item.type);
                if (item.type === 'image' || item.type === 'video') {
                  setTimeout(() => pickMedia(), 100);
                }
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={contentType === item.type ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {(contentType === 'image' || contentType === 'video') && mediaUri && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setMediaUri(null)}>
              <Ionicons name="close-circle" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Allow reactions</Text>
          <Switch
            value={allowReactions}
            onValueChange={setAllowReactions}
            trackColor={{ false: colors.border, true: '#FF5A1F' }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Allow replies</Text>
          <Switch
            value={allowReplies}
            onValueChange={setAllowReplies}
            trackColor={{ false: colors.border, true: '#FF5A1F' }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule post</Text>
          <Switch
            value={schedulePost}
            onValueChange={setSchedulePost}
            trackColor={{ false: colors.border, true: '#FF5A1F' }}
            thumbColor={colors.white}
          />
        </View>

        <TouchableOpacity style={styles.section}>
          <Text style={styles.sectionLabel}>Add to album</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  postBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  content: { padding: spacing.lg },
  textInput: { fontSize: 16, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.lg },
  typeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  typeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  typeBtnActive: { borderColor: colors.primary },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  mediaPreview: { width: '100%', height: 200, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing.lg, position: 'relative' },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
});
