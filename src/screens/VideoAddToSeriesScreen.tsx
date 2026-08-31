import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoEpisode, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoAddToSeries'>;
const SERIES_SUBTYPES = ['series', 'multi-season', 'course', 'show', 'multiple'];

export default function VideoAddToSeriesScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [series, setSeries] = useState<EarnAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    Promise.all([earnService.getAsset(videoId), earnService.getAssets('video')])
      .then(([v, all]) => {
        setVideo(v);
        const md = (v.metadata || {}) as VideoMetadata;
        setSelectedId(md.seriesId || '');
        setSeries(all.filter(a => a.id !== videoId && (SERIES_SUBTYPES.includes(a.subtype) || !!(a.metadata as VideoMetadata)?.episodes)));
      })
      .catch(e => Alert.alert('Unable to load', (e as Error).message))
      .finally(() => setLoading(false));
  }, [videoId]);

  const addToSeries = async () => {
    if (!selectedId || !video) return;
    const target = series.find(x => x.id === selectedId);
    if (!target) return;
    setBusy(true);
    try {
      const targetMd = (target.metadata || {}) as VideoMetadata;
      const episodes = targetMd.episodes || [];
      if (!episodes.some(e => e.videoAssetId === videoId)) {
        const episode: VideoEpisode = { id: `ep-${Date.now()}`, title: video.title, videoAssetId: videoId, duration: (video.metadata as VideoMetadata)?.duration, free: false };
        await earnService.updateAsset(selectedId, { metadata: { ...targetMd, episodes: [...episodes, episode] } });
      }
      const videoMd = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, { metadata: { ...videoMd, seriesId: selectedId, seriesName: target.title } });
      Alert.alert('Added to series', `"${video.title}" was added to "${target.title}".`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to add to series', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add to Series</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>Select Existing Series</Text>
        {series.map(item => {
          const md = (item.metadata || {}) as VideoMetadata;
          const selected = selectedId === item.id;
          return (
            <TouchableOpacity key={item.id} style={[s.seriesRow, selected && s.seriesRowSelected]} onPress={() => setSelectedId(item.id)}>
              <Image source={{ uri: item.image || `https://picsum.photos/seed/${item.id}/80/80` }} style={s.seriesThumb} />
              <View style={{ flex: 1 }}>
                <Text style={s.seriesTitle}>{item.title}</Text>
                <Text style={s.seriesMeta}>{(md.episodes || []).length} episodes</Text>
              </View>
              <View style={[s.radioOuter, selected && s.radioOuterActive]}>{selected && <View style={s.radioInner} />}</View>
            </TouchableOpacity>
          );
        })}
        {!series.length && <Text style={s.emptyText}>You don't have any series yet.</Text>}

        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateSeries')}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={s.createBtnText}>Create New Series</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.saveBtn, (!selectedId || busy) && { opacity: 0.45 }]} disabled={!selectedId || busy} onPress={addToSeries}>
          <Text style={s.saveBtnText}>{busy ? 'Adding…' : 'Add to Series'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: 60 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  seriesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
  seriesRowSelected: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  seriesThumb: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.border },
  seriesTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  seriesMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  emptyText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radii.lg, paddingVertical: spacing.md, marginTop: spacing.sm },
  createBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
