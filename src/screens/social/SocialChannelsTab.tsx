import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { channelsService } from '../../services/api/channels.service';
import type { Channel } from '../../types/channels';
import { colors, radii, shadow, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import Avatar from '../../components/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function SocialChannelsTab({ navigation }: Props) {
  const [view, setView] = useState<'following' | 'discover'>('following');
  const [following, setFollowing] = useState<Channel[]>([]);
  const [discover, setDiscover] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, [view]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      if (view === 'following') {
        const data = await channelsService.getFollowing();
        setFollowing(data);
      } else {
        const data = await channelsService.discover('recommended');
        setDiscover(data);
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await channelsService.search(searchQuery);
      setDiscover(results);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleFollow = async (channelId: string) => {
    try {
      await channelsService.follow(channelId);
      loadChannels();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const channels = view === 'following' ? following : discover;

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'following' && styles.toggleBtnActive]}
          onPress={() => setView('following')}
        >
          <Text style={[styles.toggleText, view === 'following' && styles.toggleTextActive]}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'discover' && styles.toggleBtnActive]}
          onPress={() => setView('discover')}
        >
          <Text style={[styles.toggleText, view === 'discover' && styles.toggleTextActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {view === 'discover' && (
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search channels"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>
      )}

      {/* Create Channel Button */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreateChannel')}
        activeOpacity={0.85}
      >
        <View style={styles.createIcon}>
          <Ionicons name="add" size={20} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.createTitle}>Create a Channel</Text>
          <Text style={styles.createSubtitle}>Share updates with your audience</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Channels List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="radio-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>
            {view === 'following' ? 'No channels yet.\nDiscover and follow channels.' : 'No channels found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.channelCard, shadow.soft]}
              onPress={() => navigation.navigate('ChannelFeed', { channelId: item.id })}
              activeOpacity={0.85}
            >
              <Avatar uri={item.avatar} size={48} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.channelName}>{item.name}</Text>
                  {item.is_monetized && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                </View>
                <Text style={styles.channelUsername}>@{item.username}</Text>
                <Text style={styles.channelMeta}>
                  {item.follower_count} followers · {item.post_count} posts
                </Text>
              </View>
              {view === 'discover' && !item.isFollowing && (
                <TouchableOpacity
                  style={styles.followBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollow(item.id);
                  }}
                >
                  <Text style={styles.followBtnText}>Follow</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  toggleTextActive: { color: colors.white },
  searchRow: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed' },
  createIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  createTitle: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  createSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  list: { padding: spacing.lg, paddingTop: spacing.md },
  channelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  channelName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  channelUsername: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  channelMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  followBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  followBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
