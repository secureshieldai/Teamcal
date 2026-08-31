import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoEpisode, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoRearrangeEpisodes'>;

export default function VideoRearrangeEpisodesScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [episodes, setEpisodes] = useState<VideoEpisode[]>([]);

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      setEpisodes((a.metadata as VideoMetadata)?.episodes || []);
    }).catch(e => Alert.alert('Unable to load series', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= episodes.length) return;
    const next = [...episodes];
    [next[index], next[target]] = [next[target], next[index]];
    setEpisodes(next);
  };

  const save = async () => {
    if (!video) return;
    setSaving(true);
    try {
      const md = (video.metadata || {}) as VideoMetadata;
      await earnService.updateAsset(videoId, { metadata: { ...md, episodes } });
      Alert.alert('Saved', 'Episode order updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setSaving(false);
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
        <Text style={s.headerTitle}>Rearrange Episodes</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={s.subtitle}>Series: {video.title}</Text>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.hint}>Use the arrows to reorder episodes.</Text>
        {episodes.map((ep, i) => (
          <View key={ep.id} style={s.epRow}>
            <Ionicons name="reorder-three-outline" size={18} color={colors.textMuted} />
            <View style={s.epNumBadge}><Text style={s.epNum}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.epTitle} numberOfLines={1}>{ep.title}</Text>
              <Text style={s.epMeta}>{ep.duration ? `${Math.round(ep.duration / 60)} min` : 'Duration pending'}</Text>
            </View>
            <View style={s.moveBtns}>
              <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} style={[s.moveBtn, i === 0 && { opacity: 0.3 }]}>
                <Ionicons name="chevron-up" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => move(i, 1)} disabled={i === episodes.length - 1} style={[s.moveBtn, i === episodes.length - 1 && { opacity: 0.3 }]}>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!episodes.length && <Text style={s.emptyText}>No episodes yet.</Text>}
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Order'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  subtitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hint: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md },
  epRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  epNumBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  epNum: { fontSize: 11, fontWeight: '800', color: colors.primary },
  epTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  epMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  moveBtns: { gap: 2 },
  moveBtn: { width: 26, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: radii.sm },
  emptyText: { fontSize: 12, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
