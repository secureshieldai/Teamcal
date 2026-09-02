import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Channel</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar & Cover */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => pickImage('avatar')} activeOpacity={0.85}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="image-outline" size={32} color={colors.white} />
              </View>
            )}
            <Text style={styles.imageLabel}>Channel photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.coverBtn} onPress={() => pickImage('cover')} activeOpacity={0.85}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverThumb} />
            ) : (
              <View style={[styles.coverThumb, styles.coverPlaceholder]}>
                <Ionicons name="image-outline" size={24} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.imageLabel}>Add cover (optional)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Channel name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter channel name"
          placeholderTextColor={colors.textMuted}
          maxLength={50}
        />

        <Text style={styles.sectionLabel}>@username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(text) => setUsername(text.replace(/[^a-z0-9_]/g, ''))}
          placeholder="Enter username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          maxLength={30}
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people what your channel is about"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.dropdownBtn}>
            <Text style={styles.dropdownText}>{CHANNEL_CATEGORIES.find(c => c.id === category)?.label || 'Select category'}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Visibility */}
        <View style={styles.visibilitySection}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setIsPublic(true)}
          >
            <View style={styles.radioOuter}>
              {isPublic && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Public channel</Text>
              <Text style={styles.radioDesc}>Anyone can find and follow</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setIsPublic(false)}
          >
            <View style={styles.radioOuter}>
              {!isPublic && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Private channel</Text>
              <Text style={styles.radioDesc}>Require approval to join</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Member Permissions */}
        <View style={styles.permissionsSection}>
          <Text style={styles.sectionTitle}>Member permissions</Text>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow reactions</Text>
            <TouchableOpacity 
              style={[styles.switch, allowReactions && styles.switchActive]}
              onPress={() => setAllowReactions(!allowReactions)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowReactions && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionLabel}>Non-admin posts</Text>
              <Text style={styles.permissionDesc}>Anyone can post to this channel</Text>
            </View>
            <TouchableOpacity 
              style={[styles.switch, allowComments && styles.switchActive]}
              onPress={() => setAllowComments(!allowComments)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowComments && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow sharing</Text>
            <TouchableOpacity 
              style={[styles.switch, allowSharing && styles.switchActive]}
              onPress={() => setAllowSharing(!allowSharing)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowSharing && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow downloads</Text>
            <TouchableOpacity 
              style={[styles.switch, allowReactions && styles.switchActive]}
              onPress={() => setAllowReactions(!allowReactions)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowReactions && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, (!name.trim() || !username.trim() || saving) && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || !username.trim() || saving}
        >
          <Text style={styles.createBtnText}>{saving ? 'Creating Channel...' : 'Create Channel'}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  imageSection: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  avatarBtn: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  coverBtn: { flex: 1, alignItems: 'center' },
  coverThumb: { width: '100%', height: 80, borderRadius: radii.lg },
  coverPlaceholder: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  imageLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.card, borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, fontSize: 15, color: colors.textPrimary },
  textArea: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  dropdown: { backgroundColor: colors.card, borderRadius: radii.lg, overflow: 'hidden' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  dropdownText: { fontSize: 15, color: colors.textPrimary },
  visibilitySection: { marginTop: spacing.xl, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  radioLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  radioDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  permissionsSection: { marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  permissionLabel: { fontSize: 15, color: colors.textPrimary },
  permissionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  switch: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border, padding: 2, justifyContent: 'center' },
  switchActive: { backgroundColor: colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  switchThumbActive: { alignSelf: 'flex-end' },
  createBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl },
  createBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
