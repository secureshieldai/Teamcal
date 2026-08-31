import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoShare'>;

const SHARE_TARGETS: { key: string; label: string; icon: string; color: string; url: (link: string, title: string) => string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', url: (l, t) => `whatsapp://send?text=${encodeURIComponent(`${t}\n${l}`)}` },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', url: (l) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(l)}` },
  { key: 'x', label: 'X', icon: 'logo-twitter', color: '#000', url: (l, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(l)}` },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane-outline', color: '#26A5E4', url: (l, t) => `https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(t)}` },
];

export default function VideoShareScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    earnService.getAsset(videoId).then(setVideo).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  const link = `https://learnhub.com/video/${video.id}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTo = async (target: typeof SHARE_TARGETS[number]) => {
    const url = target.url(link, video.title);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else await Share.share({ message: `${video.title}\n${link}` });
    } catch {
      await Share.share({ message: `${video.title}\n${link}` });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Copy/Share Video Link</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={s.content}>
        <Text style={s.label}>Video Link</Text>
        <View style={s.linkRow}>
          <Text style={s.linkText} numberOfLines={1}>{link}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={copyLink}>
            <Text style={s.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.label, { marginTop: spacing.xl }]}>Share via</Text>
        <View style={s.shareGrid}>
          {SHARE_TARGETS.map(t => (
            <TouchableOpacity key={t.key} style={s.shareItem} onPress={() => shareTo(t)}>
              <View style={[s.shareIcon, { backgroundColor: `${t.color}18` }]}>
                <Ionicons name={t.icon as any} size={22} color={t.color} />
              </View>
              <Text style={s.shareLabel}>{t.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.shareItem} onPress={() => Share.share({ message: `${video.title}\n${link}` })}>
            <View style={[s.shareIcon, { backgroundColor: colors.background }]}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
            </View>
            <Text style={s.shareLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.footer}>
        <TouchableOpacity style={s.doneBtn} onPress={navigation.goBack}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  content: { flex: 1, padding: spacing.lg },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.sm, paddingLeft: spacing.md },
  linkText: { flex: 1, fontSize: 12, color: colors.textPrimary },
  copyBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  copyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  shareItem: { alignItems: 'center', width: 64, gap: spacing.xs },
  shareIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  doneBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
