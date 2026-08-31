import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoChangeThumbnail'>;

export default function VideoChangeThumbnailScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'choose' | 'ai'>('choose');
  const [thumbUri, setThumbUri] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    earnService.getAsset(videoId).then(a => { setVideo(a); setThumbUri(a.image || ''); }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [16, 9] });
    if (!r.canceled) setThumbUri(r.assets[0].uri);
  };

  const generateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      await new Promise(res => setTimeout(res, 900));
      setThumbUri(`https://picsum.photos/seed/${encodeURIComponent(aiPrompt)}/640/360`);
    } catch (e) {
      Alert.alert('Generation failed', (e as Error).message);
    } finally {
      setAiGenerating(false);
    }
  };

  const saveThumbnail = async () => {
    if (!thumbUri) return Alert.alert('Choose a thumbnail first');
    setBusy(true);
    try {
      await earnService.updateAsset(videoId, { image: thumbUri });
      Alert.alert('Thumbnail saved', 'Your video thumbnail has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save thumbnail', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => mode === 'choose' ? navigation.goBack() : setMode('choose')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Thumbnail</Text>
        <View style={{ width: 22 }} />
      </View>

      {mode === 'choose' && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.label}>Current Thumbnail</Text>
          <View style={s.previewWrap}>
            {thumbUri ? <Image source={{ uri: thumbUri }} style={s.previewImg} /> : <View style={[s.previewImg, s.previewEmpty]}><Ionicons name="image-outline" size={30} color={colors.textMuted} /></View>}
          </View>

          <TouchableOpacity style={s.optionCard} onPress={pickImage}>
            <View style={s.optionIcon}><Ionicons name="cloud-upload-outline" size={22} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>Upload Thumbnail</Text>
              <Text style={s.optionSub}>JPG, PNG · 16:9 recommended</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.optionCard} onPress={() => setMode('ai')}>
            <View style={[s.optionIcon, { backgroundColor: '#EEE9FE' }]}><Ionicons name="sparkles-outline" size={22} color="#8B5CF6" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>AI Helper</Text>
              <Text style={s.optionSub}>Describe the thumbnail you want and let AI generate it.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.saveBtn, (!thumbUri || busy) && { opacity: 0.45 }]} disabled={!thumbUri || busy} onPress={saveThumbnail}>
            <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Thumbnail'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {mode === 'ai' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.aiContent}>
            {thumbUri ? (
              <View style={s.previewWrap}><Image source={{ uri: thumbUri }} style={s.previewImg} /></View>
            ) : (
              <View style={s.aiEmpty}>
                <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                <Text style={s.aiEmptyText}>Your generated thumbnail will appear here.</Text>
              </View>
            )}
            {thumbUri && (
              <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={saveThumbnail}>
                <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Thumbnail'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <View style={s.aiInputBar}>
            <TouchableOpacity style={s.aiInputIcon} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={s.aiInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Describe what you want…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity style={[s.aiSendBtn, (!aiPrompt.trim() || aiGenerating) && { opacity: 0.4 }]} disabled={!aiPrompt.trim() || aiGenerating} onPress={generateAi}>
              {aiGenerating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: 60 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  previewWrap: { alignItems: 'center', marginBottom: spacing.lg },
  previewImg: { width: '100%', height: 180, borderRadius: radii.lg, backgroundColor: colors.border },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.sm },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  aiContent: { padding: spacing.lg, flexGrow: 1 },
  aiEmpty: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.sm, paddingVertical: spacing.xxl },
  aiEmptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  aiInputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  aiInputIcon: { padding: spacing.xs },
  aiInput: { flex: 1, backgroundColor: colors.background, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary, maxHeight: 100 },
  aiSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
});
