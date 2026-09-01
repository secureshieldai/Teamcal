import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [isAnnouncement, setIsAnnouncement] = useState(false);
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

    setPosting(true);
    try {
      // Upload image/video to server if mediaUri exists
      let uploadedMediaUrl = null;
      if (mediaUri && contentType === 'image') {
        try {
          const result = await postsService.uploadImage(mediaUri);
          uploadedMediaUrl = result.url;
        } catch (uploadError) {
          Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
          setPosting(false);
          return;
        }
      } else if (mediaUri && contentType === 'video') {
        // For video, use the local URI for now (in production, upload to CDN)
        uploadedMediaUrl = mediaUri;
      }

      await channelsService.createPost(channelId, {
        content_type: contentType,
        text_content: textContent.trim() || null,
        media_url: uploadedMediaUrl,
        is_announcement: isAnnouncement,
      });

      Alert.alert('Posted!', 'Your post is live', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={posting}>
          <Text style={[styles.postBtn, posting && { opacity: 0.5 }]}>{posting ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.typeRow}>
          {(['text', 'image', 'video'] as PostContentType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, contentType === type && styles.typeChipActive]}
              onPress={() => setContentType(type)}
            >
              <Ionicons
                name={type === 'text' ? 'text-outline' : type === 'image' ? 'image-outline' : 'videocam-outline'}
                size={16}
                color={contentType === type ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.typeText, contentType === type && styles.typeTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.textInput}
          value={textContent}
          onChangeText={setTextContent}
          placeholder="What would you like to share?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
        />

        {(contentType === 'image' || contentType === 'video') && (
          <>
            {mediaUri ? (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setMediaUri(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addMediaBtn} onPress={pickMedia}>
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                <Text style={styles.addMediaText}>Add {contentType}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity style={styles.toggleRow} onPress={() => setIsAnnouncement(!isAnnouncement)}>
          <Ionicons name={isAnnouncement ? 'checkbox' : 'square-outline'} size={22} color={isAnnouncement ? colors.primary : colors.border} />
          <Text style={styles.toggleLabel}>Mark as announcement</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  postBtn: { fontSize: 15, fontWeight: '700', color: colors.primary },
  content: { padding: spacing.lg },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  typeTextActive: { color: colors.white },
  textInput: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, fontSize: 15, color: colors.textPrimary, minHeight: 120, textAlignVertical: 'top' },
  mediaPreview: { marginTop: spacing.md, borderRadius: radii.xl, overflow: 'hidden' },
  mediaImage: { width: '100%', height: 200 },
  removeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  addMediaBtn: { marginTop: spacing.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center' },
  addMediaText: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  toggleLabel: { fontSize: 14, color: colors.textPrimary },
});
