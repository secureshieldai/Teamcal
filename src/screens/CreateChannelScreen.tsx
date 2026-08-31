import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { CHANNEL_CATEGORIES, type ChannelCategory } from '../types/channels';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function CreateChannelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<ChannelCategory>('general');
  const [rules, setRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [saving, setSaving] = useState(false);

  const pickImage = async (type: 'avatar' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') setAvatar(result.assets[0].uri);
      else setCoverImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Required Fields', 'Please provide channel name and username');
      return;
    }

    setSaving(true);
    try {
      const channel = await channelsService.create({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        description: description.trim(),
        avatar,
        cover_image: coverImage,
        category,
        rules: rules.trim(),
        is_public: isPublic,
        allow_comments: allowComments,
        allow_reactions: allowReactions,
        allow_sharing: allowSharing,
        allow_downloads: false,
      });

      Alert.alert('Channel Created!', `${name} is ready to go`, [
        { text: 'OK', onPress: () => navigation.replace('ChannelFeed', { channelId: channel.id }) },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Channel</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverImageBtn} onPress={() => pickImage('cover')} activeOpacity={0.85}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={styles.coverText}>Add cover image (optional)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarBtn} onPress={() => pickImage('avatar')} activeOpacity={0.85}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="camera-outline" size={24} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>CHANNEL NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Wellness Daily"
          placeholderTextColor={colors.textMuted}
          maxLength={50}
        />

        <Text style={styles.sectionLabel}>USERNAME *</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.usernamePrefix}>@</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={username}
            onChangeText={(text) => setUsername(text.replace(/[^a-z0-9_]/g, ''))}
            placeholder="wellness_daily"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            maxLength={30}
          />
        </View>
        <Text style={styles.hint}>3-30 characters, lowercase, no spaces</Text>

        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's your channel about?"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />

        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {CHANNEL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={16} color={category === cat.id ? colors.white : colors.textSecondary} />
              <Text style={[styles.categoryText, category === cat.id && styles.categoryTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>CHANNEL RULES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={rules}
          onChangeText={setRules}
          placeholder="Guidelines for your community..."
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={styles.sectionLabel}>VISIBILITY & PERMISSIONS</Text>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setIsPublic(!isPublic)}>
          <Ionicons name={isPublic ? 'checkbox' : 'square-outline'} size={22} color={isPublic ? colors.primary : colors.border} />
          <Text style={styles.toggleLabel}>Public channel (anyone can find and follow)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setAllowComments(!allowComments)}>
          <Ionicons name={allowComments ? 'checkbox' : 'square-outline'} size={22} color={allowComments ? colors.primary : colors.border} />
          <Text style={styles.toggleLabel}>Allow comments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setAllowReactions(!allowReactions)}>
          <Ionicons name={allowReactions ? 'checkbox' : 'square-outline'} size={22} color={allowReactions ? colors.primary : colors.border} />
          <Text style={styles.toggleLabel}>Allow reactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setAllowSharing(!allowSharing)}>
          <Ionicons name={allowSharing ? 'checkbox' : 'square-outline'} size={22} color={allowSharing ? colors.primary : colors.border} />
          <Text style={styles.toggleLabel}>Allow sharing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createBtn, saving && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={saving}
        >
          <Text style={styles.createBtnText}>{saving ? 'Creating...' : 'Create Channel'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: spacing.lg, paddingTop: 0 },
  coverImageBtn: { width: '100%', height: 140, borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.xl },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  coverText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  avatarBtn: { alignSelf: 'center', marginTop: -40, marginBottom: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.background },
  avatarPlaceholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 14, color: colors.textPrimary },
  textArea: { borderRadius: radii.xl, paddingTop: spacing.md, minHeight: 80 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  usernamePrefix: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 11.5, color: colors.textMuted, marginTop: spacing.xs },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  categoryTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  toggleLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  createBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl },
  createBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
