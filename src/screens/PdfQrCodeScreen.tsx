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

type Props = NativeStackScreenProps<RootStackParamList, 'PdfQrCode'>;

export default function PdfQrCodeScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    earnService.getAsset(pdfId).then(setPdf).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  if (loading || !pdf) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  const isPublic = pdf.status === 'published';
  const link = `https://teamcal.app/pdf/${pdf.id}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(link);
    Alert.alert('PDF link copied.');
  };

  const shareQr = () => {
    if (qrRef.current) {
      qrRef.current.toDataURL((dataURL: string) => {
        Share.share({ message: `Scan to view "${pdf.title}": ${link}`, url: `data:image/png;base64,${dataURL}` }).catch(() => Share.share({ message: link }));
      });
    } else {
      Share.share({ message: link });
    }
  };

  const downloadQr = () => {
    Alert.alert('QR code ready', 'Use Share QR Code to save it to your device via the share sheet.');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>QR Code</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.content}>
        {isPublic ? (
          <>
            <View style={s.qrCard}>
              <QRCode value={link} size={220} color={colors.textPrimary} backgroundColor="#fff" getRef={(c) => (qrRef.current = c)} />
            </View>
            <Text style={s.pdfTitle} numberOfLines={2}>{pdf.title}</Text>
            <Text style={s.linkText} numberOfLines={1}>{link}</Text>

            <TouchableOpacity style={s.primaryBtn} onPress={downloadQr}>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={s.primaryBtnText}>Download QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={shareQr}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={s.secondaryBtnText}>Share QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={copyLink}>
              <Ionicons name="link-outline" size={16} color={colors.primary} />
              <Text style={s.secondaryBtnText}>Copy PDF Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('PdfReader', { pdfId, preview: true })}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={s.secondaryBtnText}>Test QR Code / Open Link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.notPublic}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
            <Text style={s.notPublicTitle}>PDF is not public yet</Text>
            <Text style={s.notPublicSub}>A scannable QR code can't be generated until this PDF is published and publicly accessible.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={async () => {
              try { await earnService.updateAsset(pdfId, { status: 'published' }); setPdf(p => p ? { ...p, status: 'published' } as EarnAsset : p); }
              catch (e) { Alert.alert('Error', (e as Error).message); }
            }}>
              <Text style={s.primaryBtnText}>Publish PDF</Text>
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
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  qrCard: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  pdfTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  linkText: { fontSize: 11, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, width: '100%', marginBottom: spacing.sm },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, width: '100%', marginBottom: spacing.sm },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  notPublic: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  notPublicTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  notPublicSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
});
