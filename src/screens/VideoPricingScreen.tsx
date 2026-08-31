import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { MonetizationStep } from './earn/video/VideoWizardShared';
import type { MonetizationType } from './earn/video/videoData';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPricing'>;

const MODE_TO_MONETIZATION: Record<MonetizationType, VideoMetadata['monetization']> = {
  paid: 'paid-video',
  'ad-based': 'creator-rewards',
  ppv: 'episode',
};
const MONETIZATION_TO_MODE = (m?: string): MonetizationType => (m === 'creator-rewards' ? 'ad-based' : m === 'episode' || m === 'season' ? 'ppv' : 'paid');

export default function VideoPricingScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MonetizationType>('paid');
  const [price, setPrice] = useState('9.99');
  const [allowComments, setAllowComments] = useState(true);
  const [allowLikes, setAllowLikes] = useState(true);
  const [addToShowcase, setAddToShowcase] = useState(false);

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      const md = (a.metadata || {}) as VideoMetadata;
      setSelected(MONETIZATION_TO_MODE(md.monetization));
      setPrice(String(a.price || 9.99));
      setAllowComments(md.commentsEnabled ?? true);
      setAllowLikes(true);
    }).catch(e => Alert.alert('Unable to load video', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const save = async () => {
    if (!video) return;
    setBusy(true);
    try {
      const md = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, {
        price: selected === 'ad-based' ? 0 : Number(price) || 0,
        metadata: { ...md, monetization: MODE_TO_MONETIZATION[selected], commentsEnabled: allowComments },
      });
      Alert.alert('Saved', 'Price and monetization settings updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
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
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Price & Monetization</Text>
        <View style={{ width: 22 }} />
      </View>

      <MonetizationStep
        selected={selected} onSelect={setSelected}
        price={price} onPrice={setPrice}
        allowComments={allowComments} onAllowComments={setAllowComments}
        allowLikes={allowLikes} onAllowLikes={setAllowLikes}
        addToShowcase={addToShowcase} onAddToShowcase={setAddToShowcase}
      />

      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
          <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, fontSize: 16, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
