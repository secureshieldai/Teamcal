import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoSubscribers'>;

export default function VideoSubscribersScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    earnService.getAsset(videoId).then(setVideo).catch(e => Alert.alert('Unable to load', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  const subscribers = (video.metadata as VideoMetadata)?.subscribers || [];
  const filtered = search.trim() ? subscribers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : subscribers;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>View Subscribers</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="filter-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={s.statsRow}>
        <View style={s.statBox}><Text style={s.statValue}>{subscribers.length}</Text><Text style={s.statLabel}>Total Subscribers</Text></View>
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search subscribers…" placeholderTextColor={colors.textMuted} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No subscribers yet</Text>
            <Text style={s.emptyText}>This list populates automatically as viewers subscribe.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.row}>
            <Image source={{ uri: item.avatar || `https://i.pravatar.cc/80?u=${item.id}` }} style={s.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>Subscribed on {new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </View>
            <View style={s.activePill}><Text style={s.activePillText}>Active</Text></View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.border },
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  activePill: { backgroundColor: '#E6F9F0', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  activePillText: { fontSize: 10, fontWeight: '700', color: colors.success },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
