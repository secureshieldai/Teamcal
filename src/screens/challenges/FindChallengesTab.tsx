import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../../theme';
import { useChallenges } from '../../hooks/useChallenges';
import { challengesService } from '../../services/api/challenges.service';
import { challengeTypes } from '../../data/challengesData';
import type { RootStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const FILTERS = [{ id: 'all', label: 'All' }, ...challengeTypes.map((t) => ({ id: t.id, label: t.label }))];

export default function FindChallengesTab({ navigation }: Props) {
  const { challenges, loading, refetch } = useChallenges('discover');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const filtered = useMemo(
    () =>
      challenges.filter(
        (c) =>
          (filter === 'all' || c.challenge_type === filter) &&
          (!query.trim() || c.title.toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [challenges, filter, query]
  );

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      await challengesService.join(id);
      await refetch();
    } catch (error) {
      Alert.alert('Could not join challenge', (error as Error).message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search challenges"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.filtersLabel}>Filters</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <TouchableOpacity key={f.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilter(f.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
      {!loading && filtered.length === 0 && <Text style={styles.emptyText}>No challenges match your search.</Text>}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {filtered.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[styles.card, shadow.soft]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
          >
            <Image source={{ uri: challenge.photo ?? undefined }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {challenge.title}
              </Text>
              <Text style={styles.byLine}>by {challenge.creator_name || 'TeamCal'}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{challenge.joined_count}</Text>
                <Text style={styles.metaText}>
                  {challenge.duration_days} days
                  {challenge.goal_target ? ` • ${challenge.goal_target.toLocaleString()} ${challenge.goal_unit || ''}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.joinBtn} disabled={joiningId === challenge.id} onPress={() => handleJoin(challenge.id)}>
              <Text style={styles.joinBtnText}>{joiningId === challenge.id ? 'Joining…' : 'Join'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  filterIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  filtersLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  filterRow: { gap: spacing.sm },
  chip: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  byLine: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600', marginRight: spacing.sm },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  joinBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
