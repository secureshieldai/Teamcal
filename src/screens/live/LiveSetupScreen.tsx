import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { liveService } from '../../services/api/live.service';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Visibility = 'public' | 'followers' | 'community';

export default function LiveSetupScreen() {
  const navigation = useNavigation<Nav>();
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [cameraOn, setCameraOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);

  // Check network quality on mount
  useEffect(() => {
    const start = Date.now();
    fetch('https://www.google.com/generate_204', { method: 'HEAD', cache: 'no-cache' })
      .then(() => { setNetworkOk(Date.now() - start < 800); })
      .catch(() => setNetworkOk(false));
  }, []);

  async function requestPermissions() {
    if (!cameraPermission?.granted) await requestCamera();
    if (!micPermission?.granted) await requestMic();
  }

  useEffect(() => { requestPermissions(); }, []);

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setCoverImage(result.assets[0].uri);
  }

  async function goLive() {
    if (!title.trim()) { Alert.alert('Title required', 'Please enter a stream title.'); return; }
    if (!cameraPermission?.granted || !micPermission?.granted) {
      Alert.alert('Permissions needed', 'Camera and microphone access is required to go live.');
      await requestPermissions();
      return;
    }
    try {
      setLoading(true);
      const stream = await liveService.createStream({
        title: title.trim(),
        description: description.trim() || undefined,
        coverImage,
        visibility,
        allowComments,
        allowReactions,
      });
      navigation.replace('LiveHost', { streamId: stream.id });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  }

  const permissionsGranted = cameraPermission?.granted && micPermission?.granted;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Go Live</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Camera preview */}
          <View style={s.previewWrap}>
            {cameraOn && permissionsGranted ? (
              <CameraView style={s.camera} facing={facing} />
            ) : (
              <View style={[s.camera, s.cameraOff]}>
                <Ionicons name="videocam-off-outline" size={40} color="#fff" />
                <Text style={s.cameraOffText}>{permissionsGranted ? 'Camera off' : 'Camera permission needed'}</Text>
              </View>
            )}
            <View style={s.previewControls}>
              <TouchableOpacity style={s.previewBtn} onPress={() => setCameraOn(v => !v)}>
                <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.previewBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
                <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Network indicator */}
          <View style={s.networkRow}>
            <Ionicons
              name={networkOk === null ? 'wifi-outline' : networkOk ? 'wifi' : 'wifi-outline'}
              size={16}
              color={networkOk === null ? colors.textMuted : networkOk ? colors.success : '#FF4444'}
            />
            <Text style={[s.networkText, { color: networkOk === null ? colors.textMuted : networkOk ? colors.success : '#FF4444' }]}>
              {networkOk === null ? 'Checking connection…' : networkOk ? 'Connection looks good' : 'Weak connection — stream may be unstable'}
            </Text>
          </View>

          {/* Title */}
          <View style={s.field}>
            <Text style={s.label}>Stream title *</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What's your stream about?"
              placeholderTextColor={colors.textMuted}
              maxLength={120}
            />
          </View>

          {/* Description */}
          <View style={s.field}>
            <Text style={s.label}>Description (optional)</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers what to expect…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Cover image */}
          <View style={s.field}>
            <Text style={s.label}>Cover image (optional)</Text>
            <TouchableOpacity style={s.coverPicker} onPress={pickCover} activeOpacity={0.8}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={s.coverImage} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                  <Text style={s.coverPickerText}>Choose image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Visibility */}
          <View style={s.field}>
            <Text style={s.label}>Who can watch</Text>
            <View style={s.visRow}>
              {(['public', 'followers', 'community'] as Visibility[]).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[s.visBtn, visibility === v && s.visBtnActive]}
                  onPress={() => setVisibility(v)}
                >
                  <Text style={[s.visBtnText, visibility === v && s.visBtnTextActive]}>
                    {v === 'public' ? 'Public' : v === 'followers' ? 'Followers' : 'Community'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Toggles */}
          <View style={s.toggleRow}>
            <Toggle label="Comments" value={allowComments} onChange={setAllowComments} />
            <Toggle label="Reactions" value={allowReactions} onChange={setAllowReactions} />
          </View>

          {/* Permission warning */}
          {!permissionsGranted && (
            <TouchableOpacity style={s.permBanner} onPress={requestPermissions}>
              <Ionicons name="warning-outline" size={16} color="#FF8800" />
              <Text style={s.permBannerText}>Tap to grant camera & microphone access</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Go Live button */}
        <View style={s.footer}>
          <TouchableOpacity style={[s.goLiveBtn, loading && { opacity: 0.6 }]} onPress={goLive} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={s.liveDot} />
                <Text style={s.goLiveBtnText}>Go Live</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={s.toggle} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <Text style={s.toggleLabel}>{label}</Text>
      <View style={[s.toggleTrack, value && s.toggleTrackOn]}>
        <View style={[s.toggleThumb, value && s.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  scroll: { padding: spacing.lg, paddingBottom: 20 },
  previewWrap: { borderRadius: radii.xl, overflow: 'hidden', height: 220, backgroundColor: '#000', marginBottom: spacing.md },
  camera: { flex: 1 },
  cameraOff: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  cameraOffText: { color: '#fff', fontSize: 13 },
  previewControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: spacing.sm },
  previewBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  networkText: { fontSize: 12, fontWeight: '500' },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  textarea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  coverPicker: { height: 100, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.card, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverPickerText: { fontSize: 13, color: colors.textMuted },
  visRow: { flexDirection: 'row', gap: spacing.sm },
  visBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.card },
  visBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF1EB' },
  visBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  visBtnTextActive: { color: colors.primary },
  toggleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleTrackOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  permBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF8E7', borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: '#FFD580' },
  permBannerText: { fontSize: 13, color: '#CC7700', flex: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  goLiveBtn: { backgroundColor: '#FF4444', borderRadius: radii.pill, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  goLiveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
