import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfCover'>;

export default function PdfCoverScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'choose' | 'upload' | 'ai'>('choose');
  const [coverUri, setCoverUri] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    earnService.getAsset(pdfId).then(a => { setPdf(a); setCoverUri(a.image || ''); }).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [2, 3] });
    if (!r.canceled) { setCoverUri(r.assets[0].uri); setMode('upload'); }
  };

  const generateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      // Use existing cover as a stand-in preview seed until a real image-gen endpoint responds.
      await new Promise(res => setTimeout(res, 900));
      setCoverUri(`https://picsum.photos/seed/${encodeURIComponent(aiPrompt)}/500/750`);
    } catch (e) {
      Alert.alert('Generation failed', (e as Error).message);
    } finally {
      setAiGenerating(false);
    }
  };

  const saveCover = async () => {
    if (!coverUri) return Alert.alert('Choose a cover first');
    setBusy(true);
    try {
      await earnService.updateAsset(pdfId, { image: coverUri });
      Alert.alert('Cover saved', 'Your PDF cover has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save cover', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeCover = () => {
    Alert.alert('Remove cover?', 'This PDF will use a default placeholder cover.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setCoverUri('') },
    ]);
  };

  if (loading || !pdf) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => mode === 'choose' ? navigation.goBack() : setMode('choose')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Cover</Text>
        <View style={{ width: 22 }} />
      </View>

      {mode === 'choose' && (
        <ScrollView contentContainerStyle={s.content}>
          {coverUri ? (
            <View style={s.previewWrap}>
              <Image source={{ uri: coverUri }} style={s.previewImg} />
            </View>
          ) : null}
          <TouchableOpacity style={s.optionCard} onPress={pickImage}>
            <View style={s.optionIcon}><Ionicons name="cloud-upload-outline" size={22} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>Upload Cover</Text>
              <Text style={s.optionSub}>Choose, crop and reposition an image from your device.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.optionCard} onPress={() => setMode('ai')}>
            <View style={[s.optionIcon, { backgroundColor: '#EEE9FE' }]}><Ionicons name="sparkles-outline" size={22} color="#8B5CF6" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>AI Helper</Text>
              <Text style={s.optionSub}>Describe the cover you want and let AI generate it.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {coverUri && (
            <TouchableOpacity style={s.removeBtn} onPress={removeCover}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={s.removeBtnText}>Remove cover</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.saveBtn, (!coverUri || busy) && { opacity: 0.45 }]} disabled={!coverUri || busy} onPress={saveCover}>
            <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Cover'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {mode === 'ai' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.aiContent}>
            {coverUri ? (
              <View style={s.previewWrap}><Image source={{ uri: coverUri }} style={s.previewImg} /></View>
            ) : (
              <View style={s.aiEmpty}>
                <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                <Text style={s.aiEmptyText}>Your generated cover will appear here.</Text>
              </View>
            )}
            {coverUri && (
              <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={saveCover}>
                <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Cover'}</Text>
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
            <TouchableOpacity style={s.aiInputIcon}>
              <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
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
  previewWrap: { alignItems: 'center', marginBottom: spacing.lg },
  previewImg: { width: 160, height: 220, borderRadius: radii.lg, backgroundColor: colors.border },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.sm },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  removeBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
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
