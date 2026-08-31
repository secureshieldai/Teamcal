import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { CHANNEL_CATEGORIES, type Channel, type ChannelCategory } from '../types/channels';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

export default function ChannelDiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory | 'all'>('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, [selectedCategory]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = selectedCategory === 'all' 
        ? await channelsService.discover('trending')
        : await channelsService.getByCategory(selectedCategory);
      setChannels(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Discover Channels</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GlobalSearch')}>
          <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryScroll}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {CHANNEL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.id ? colors.white : colors.textSecondary} />
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.channelCard, shadow.soft]}
              onPress={() => navigation.navigate('ChannelFeed', { channelId: item.id })}
            >
              <Avatar uri={item.avatar} size={56} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.channelName}>{item.name}</Text>
                <Text style={styles.channelUsername}>@{item.username}</Text>
                <Text style={styles.channelMeta}>{item.follower_count} followers</Text>
                {item.description && <Text style={styles.channelDesc} numberOfLines={2}>{item.description}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  categoryScroll: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  categoryTextActive: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg },
  channelCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  channelName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  channelUsername: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  channelMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  channelDesc: { fontSize: 13, color: colors.textPrimary, marginTop: spacing.xs, lineHeight: 18 },
});
