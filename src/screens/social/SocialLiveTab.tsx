import React, { useEffect } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { liveService, type LiveStream } from '../../services/api/live.service';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SocialLiveTab() {
  const navigation = useNavigation<Nav>();
  const streams = useApiQuery<LiveStream[]>(() => liveService.listStreams(), [], []);

  // Join discover room for real-time viewer count updates
  useEffect(() => {
    liveService.joinDiscoverRoom().catch(() => {});
  }, []);

  return (
    <FlatList
      data={streams.data}
      keyExtractor={item => item.id}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onRefresh={streams.refetch}
      refreshing={streams.loading}
      ListHeaderComponent={<GoLiveCard onPress={() => navigation.navigate('LiveSetup')} />}
      ListEmptyComponent={
        !streams.loading ? (
          <View style={s.empty}>
            <Ionicons name="radio-outline" size={44} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No one is live right now</Text>
            <Text style={s.emptySub}>Be the first to go live and grow your audience.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <LiveCard stream={item} onPress={() => navigation.navigate('LiveViewer', { streamId: item.id })} />
      )}
    />
  );
}

function GoLiveCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={s.goLiveCard} activeOpacity={0.85} onPress={onPress}>
      <View style={s.goLiveLeft}>
        <View style={s.goLiveIcon}>
          <Ionicons name="radio" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={s.goLiveTitle}>Start Live Stream</Text>
          <Text style={s.goLiveSub}>Go live and connect with your audience</Text>
        </View>
      </View>
      <TouchableOpacity style={s.startLiveBtn} onPress={onPress}>
        <Text style={s.startLiveBtnText}>Start Live</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function LiveCard({ stream, onPress }: { stream: LiveStream; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.liveCard, shadow.soft]} activeOpacity={0.85} onPress={onPress}>
      <View style={s.thumbnailWrap}>
        <Image
          source={{ uri: stream.cover_image || `https://picsum.photos/seed/${stream.id}/400/220` }}
          style={s.thumbnail}
        />
        <View style={s.livePill}>
          <View style={s.liveDot} />
          <Text style={s.livePillText}>LIVE</Text>
        </View>
        <View style={s.viewerBadge}>
          <Ionicons name="eye-outline" size={12} color="#fff" />
          <Text style={s.viewerText}>{stream.viewer_count}</Text>
        </View>
      </View>
      <View style={s.liveInfo}>
        {stream.host?.avatar ? (
          <Image source={{ uri: stream.host.avatar }} style={s.creatorAvatar} />
        ) : (
          <View style={[s.creatorAvatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{stream.host?.name?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.liveTitle} numberOfLines={1}>{stream.title}</Text>
          <Text style={s.liveCreator}>{stream.host?.name ?? 'Unknown'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  goLiveCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF8F5', borderRadius: radii.xl, padding: spacing.md, borderWidth: 1.5, borderColor: colors.primary + '40', marginBottom: spacing.sm },
  goLiveLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  goLiveIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  goLiveTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  goLiveSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  startLiveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  startLiveBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  liveCard: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  thumbnailWrap: { height: 180, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  livePill: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF4444', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  viewerBadge: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 3 },
  viewerText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  liveInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  liveTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  liveCreator: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
