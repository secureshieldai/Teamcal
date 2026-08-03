import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { videos, type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { useEarnAssets } from '../../hooks/useEarnAssets';
import CreateAssetModal from './components/CreateAssetModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const UPLOAD_OPTIONS = [
  { key: 'upload', label: 'Upload Video', icon: 'cloud-upload-outline' },
  { key: 'multiple', label: 'Upload Multiple', icon: 'copy-outline' },
  { key: 'series', label: 'Create Series', icon: 'film-outline' },
  { key: 'course', label: 'Create Course', icon: 'school-outline' },
  { key: 'record', label: 'Record Video', icon: 'videocam-outline' },
  { key: 'import', label: 'Import from Cloud', icon: 'cloud-outline' },
] as const;

export default function VideosTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [createOption,setCreateOption]=useState<(typeof UPLOAD_OPTIONS)[number]|null>(null);
  const userAssets=useEarnAssets('video');

  const totals = useMemo(
    () => ({
      count: videos.length,
      views: videos.reduce((s, v) => s + v.views, 0),
      qualifiedViews: videos.reduce((s, v) => s + v.qualifiedViews, 0),
      earnings: videos.reduce((s, v) => s + v.earned, 0),
    }),
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Earn with Videos</Text>
          <Text style={styles.subtitle}>Upload individual videos or series, choose how viewers gain access and earn from purchases, subscriptions or qualified views.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.audienceEngineBtn} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: 'Videos' })} activeOpacity={0.85}>
        <Ionicons name="people-circle-outline" size={16} color={colors.white} />
        <Text style={styles.audienceEngineBtnText}>Audience Engine</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <StatCard label="Total Videos" value={String(totals.count)} icon="videocam-outline" />
        <StatCard label="Total Views" value={totals.views.toLocaleString()} icon="eye-outline" />
        <StatCard label="Qualified Views" value={totals.qualifiedViews.toLocaleString()} icon="checkmark-circle-outline" />
        <StatCard label="Total Earnings" value={`$${totals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" />
        <StatCard label="Total Subscribers" value="3,680" icon="people-outline" />
        <StatCard label="Avg. Completion" value="62.4%" icon="stats-chart-outline" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <Text style={styles.sectionTitle}>Upload a Video or Create a Series</Text>
      <View style={styles.optionsGrid}>
        {UPLOAD_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.optionItem} onPress={() => setCreateOption(opt)}>
            <View style={styles.optionIcon}>
              <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your Videos & Series</Text>
      {userAssets.error?<Text style={styles.itemMeta}>Could not load your videos: {userAssets.error}</Text>:null}
      <View style={{gap:spacing.md}}>{userAssets.assets.map(video=><TouchableOpacity key={video.id} style={[styles.itemCard,shadow.soft]} onPress={async()=>{try{await userAssets.update(video.id,{status:video.status==='published'?'draft':'published'});}catch(e){Alert.alert('Unable to update',(e as Error).message);}}}><Image source={{uri:video.image||`https://picsum.photos/seed/${video.id}/300/400`}} style={styles.videoThumb}/><View style={{flex:1}}><View style={styles.itemTopRow}><Text style={styles.itemName} numberOfLines={1}>{video.title}</Text><StatusBadge status={video.status}/></View><Text style={styles.itemMeta}>{video.subtype} · ${Number(video.price).toFixed(2)}</Text><View style={styles.itemStatsRow}><Text style={styles.itemStat}>{video.metrics?.views||0} Views</Text><Text style={styles.itemStat}>{video.metrics?.completion||0}% Completion</Text><Text style={styles.itemStat}>${video.metrics?.earned||0} Earned</Text></View></View></TouchableOpacity>)}{!userAssets.loading&&!userAssets.assets.length?<Text style={styles.itemMeta}>No personal videos yet. Create one above.</Text>:null}</View>
      <Text style={styles.sectionTitle}>Showcase Videos & Series</Text>
      <View style={{ gap: spacing.md, marginBottom: spacing.xxl }}>
        {videos.map((video) => (
          <TouchableOpacity key={video.id} style={[styles.itemCard, shadow.soft]} activeOpacity={0.85} onPress={() => Alert.alert('Showcase video','This example is separate from your saved videos.')}>
            <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} />
            <View style={{ flex: 1 }}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {video.title}
                </Text>
                <StatusBadge status={video.status} />
              </View>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {video.subtitle} · {video.monetization}
              </Text>
              <View style={styles.itemStatsRow}>
                <Text style={styles.itemStat}>{video.views.toLocaleString()} Views</Text>
                <Text style={styles.itemStat}>{video.completion}% Completion</Text>
                <Text style={styles.itemStat}>${video.earned.toLocaleString()} Earned</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <CreateAssetModal visible={Boolean(createOption)} heading="Create Video" subtype={createOption?.label||''} onClose={()=>setCreateOption(null)} onSubmit={value=>userAssets.create({kind:'video',subtype:createOption?.key||'upload',...value}).then(()=>{})}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row' },
  title: { ...typography.h2, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  audienceEngineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  audienceEngineBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionItem: { width: '31%', backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.md, alignItems: 'center' },
  optionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 10, fontWeight: '700', color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
  itemCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  videoThumb: { width: 68, height: 52, borderRadius: radii.md, backgroundColor: colors.border },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  itemStat: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
});
