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
  const [view, setView] = useState<'feed' | 'all' | 'owned'>('feed');
  const [following, setFollowing] = useState<Channel[]>([]);
  const [discover, setDiscover] = useState<Channel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, [view]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      if (view === 'feed') {
        const data = await channelsService.getFollowing();
        setFollowing(data);
      } else if (view === 'all') {
        const data = await channelsService.discover('recommended');
        setDiscover(data);
      } else if (view === 'owned') {
        const data = await channelsService.getMyChannels();
        setOwnedChannels(data);
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

  const channels = view === 'feed' ? following : view === 'all' ? discover : ownedChannels;

  return (
    <View style={styles.container}>
      {/* Header with title and action icons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CreateChannel')} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.addIcon}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'feed' && styles.toggleBtnActive]}
          onPress={() => setView('feed')}
        >
          <Text style={[styles.toggleText, view === 'feed' && styles.toggleTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'all' && styles.toggleBtnActive]}
          onPress={() => setView('all')}
        >
          <Text style={[styles.toggleText, view === 'all' && styles.toggleTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'owned' && styles.toggleBtnActive]}
          onPress={() => setView('owned')}
        >
          <Text style={[styles.toggleText, view === 'owned' && styles.toggleTextActive]}>Owned</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input - Always visible */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
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

      {/* Categories Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity style={[styles.categoryBtn, styles.categoryBtnActive]}>
          <Text style={[styles.categoryBtnText, styles.categoryBtnTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryBtn}>
          <Text style={styles.categoryBtnText}>Wellness</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryBtn}>
          <Text style={styles.categoryBtnText}>Fitness</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryBtn}>
          <Text style={styles.categoryBtnText}>Nutrition</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryBtn}>
          <Text style={styles.categoryBtnText}>Mindfulness</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Channel Banner - Only on Feed view */}
      {view === 'feed' && (
        <TouchableOpacity
          style={styles.createBanner}
          onPress={() => navigation.navigate('CreateChannel')}
          activeOpacity={0.85}
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>Create a channel</Text>
            <Text style={styles.createSubtitle}>Share updates with your audience</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Channels List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="radio-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>
            {view === 'feed' ? 'No channels yet.\nFollow some channels to see updates.' : view === 'all' ? 'No channels found' : 'No channels owned.\nCreate your first channel!'}
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
              <Avatar uri={item.avatar} size={52} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.channelName}>{item.name}</Text>
                  {item.is_monetized && <Ionicons name="checkmark-circle" size={15} color={colors.primary} />}
                </View>
                <Text style={styles.channelSubtitle}>{item.description || `@${item.username}`}</Text>
                <Text style={styles.channelMeta}>
                  {item.follower_count.toLocaleString()} followers · {item.post_count} posts
                </Text>
              </View>
              {view === 'all' && !item.isFollowing && (
                <TouchableOpacity
                  style={styles.followBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollow(item.id);
                  }}
                >
                  <Ionicons name="add" size={16} color={colors.white} />
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
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  addIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderRadius: radii.pill, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  toggleTextActive: { color: colors.white },
  searchRow: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  categories: { marginTop: spacing.md },
  categoriesContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  categoryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card },
  categoryBtnActive: { backgroundColor: colors.primary },
  categoryBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  categoryBtnTextActive: { color: colors.white },
  createBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg, backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  createIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  createTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  createSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  list: { padding: spacing.lg, paddingTop: spacing.md },
  channelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  channelName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  channelSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  channelMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  followBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
