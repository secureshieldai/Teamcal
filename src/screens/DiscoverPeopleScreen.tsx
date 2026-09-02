import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SearchBar from '../components/SearchBar';
import Avatar from '../components/Avatar';
import { socialService, type LeaderboardUser } from '../services/api/social.service';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DiscoverPeople'>;

type Row = LeaderboardUser & { bio?: string; following?: boolean };

export default function DiscoverPeopleScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Row[] | null>(null);
  const [suggested, setSuggested] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState<Record<string, boolean>>({});
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    socialService
      .getCreators()
      .then((creators) => {
        setSuggested(creators);
        setFollowed(Object.fromEntries(creators.map((c) => [c.id, c.following])));
      })
      .catch(() => setSuggested([]));
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      setResults(await socialService.searchUsers(q));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(runSearch, 350);
    return () => clearTimeout(t);
  }, [runSearch]);

  const toggleFollow = async (id: string) => {
    if (followBusy[id]) return;
    setFollowBusy((b) => ({ ...b, [id]: true }));
    setFollowed((f) => ({ ...f, [id]: !f[id] }));
    try {
      const following = await socialService.toggleFollow(id);
      setFollowed((f) => ({ ...f, [id]: following }));
    } catch {
      setFollowed((f) => ({ ...f, [id]: !f[id] }));
    } finally {
      setFollowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const data = results ?? suggested;
  const heading = results ? (loading ? 'Searching…' : `${data.length} result${data.length === 1 ? '' : 's'}`) : 'Suggested for you';

  const renderItem = useMemo(
    () =>
      ({ item }: { item: Row }) => (
        <View style={s.row}>
          <TouchableOpacity
            style={s.identity}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.name })}
          >
            <Avatar uri={item.avatar || ''} size={46} />
            <View style={s.identityText}>
              <View style={s.nameRow}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                {item.verified ? <Ionicons name="checkmark-circle" size={14} color={colors.primary} /> : null}
              </View>
              <Text style={s.meta} numberOfLines={1}>{item.bio || `Level ${item.level}`}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.followBtn, followed[item.id] && s.followingBtn]}
            onPress={() => toggleFollow(item.id)}
          >
            <Text style={[s.followText, followed[item.id] && s.followingText]}>{followed[item.id] ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.msgBtn}
            onPress={() => navigation.navigate('DirectMessage', { userId: item.id, name: item.name, avatar: item.avatar })}
          >
            <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    [followed, followBusy, navigation],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Discover people</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={runSearch} placeholder="Search people by name" />
      </View>

      <FlatList
        data={data}
        keyExtractor={(x) => x.id}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Text style={s.sectionTitle}>{heading}</Text>}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <Text style={s.empty}>{results ? 'No people found.' : 'No suggestions yet.'}</Text>
          )
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  sectionTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  followBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  followingBtn: { backgroundColor: colors.border },
  followText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  followingText: { color: colors.textPrimary },
  msgBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
