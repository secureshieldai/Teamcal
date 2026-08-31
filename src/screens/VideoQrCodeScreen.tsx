import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoQrCode'>;

export default function VideoQrCodeScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    earnService.getAsset(videoId).then(setVideo).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  const isPublic = video.status === 'published';
  const link = `https://learnhub.com/video/${video.id}`;

  const shareQr = () => {
    if (qrRef.current) {
      qrRef.current.toDataURL((dataURL: string) => {
        Share.share({ message: `Scan to watch "${video.title}": ${link}`, url: `data:image/png;base64,${dataURL}` }).catch(() => Share.share({ message: link }));
      });
    } else {
      Share.share({ message: link });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Generate QR Code</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.content}>
        {isPublic ? (
          <>
            <Text style={s.videoTitle} numberOfLines={2}>{video.title}</Text>
            <View style={s.qrCard}>
              <QRCode value={link} size={220} color={colors.textPrimary} backgroundColor="#fff" getRef={(c) => (qrRef.current = c)} />
            </View>

            <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('QR code ready', 'Use Share QR Code to save it to your device via the share sheet.')}>
              <Ionicons name="download-outline" size={16} color={colors.primary} />
              <Text style={s.secondaryBtnText}>Download QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={shareQr}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={s.secondaryBtnText}>Share QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.primaryBtn} onPress={async () => { await Clipboard.setStringAsync(link); Alert.alert('Video link copied.'); }}>
              <Text style={s.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.notPublic}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
            <Text style={s.notPublicTitle}>Video is not public yet</Text>
            <Text style={s.notPublicSub}>A scannable QR code can't be generated until this video is published and publicly accessible.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={async () => {
              try { const updated = await earnService.updateAsset(videoId, { status: 'published' }); setVideo(updated); }
              catch (e) { Alert.alert('Error', (e as Error).message); }
            }}>
              <Text style={s.primaryBtnText}>Publish Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, fontSize: 16, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  videoTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  qrCard: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, width: '100%', marginBottom: spacing.sm, marginTop: spacing.sm },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, width: '100%', marginBottom: spacing.sm },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  notPublic: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  notPublicTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  notPublicSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
});
