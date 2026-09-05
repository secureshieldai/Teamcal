import React, { useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - spacing.lg * 2 - spacing.xs * 2) / 3;

type MediaItem = {
  id: string;
  type: 'image' | 'video' | 'file';
  uri: string;
  thumbnail?: string;
  name?: string;
  size?: string;
  duration?: string;
};

type TabType = 'media' | 'files' | 'albums';

const MOCK_MEDIA: MediaItem[] = [
  { id: '1', type: 'image', uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
  { id: '2', type: 'video', uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', duration: '2:15' },
  { id: '3', type: 'image', uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
  { id: '4', type: 'image', uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { id: '5', type: 'video', uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400', duration: '5:43' },
  { id: '6', type: 'image', uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400' },
  { id: '7', type: 'image', uri: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400' },
  { id: '8', type: 'video', uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', duration: '1:30' },
  { id: '9', type: 'image', uri: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=400' },
  { id: '10', type: 'image', uri: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=400' },
  { id: '11', type: 'image', uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400' },
  { id: '12', type: 'image', uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400' },
];

const MOCK_FILES: MediaItem[] = [
  { id: 'f1', type: 'file', uri: '', name: 'Workout Plan.pdf', size: '2.3 MB' },
  { id: 'f2', type: 'file', uri: '', name: 'Meal Guide.pdf', size: '1.8 MB' },
  { id: 'f3', type: 'file', uri: '', name: 'Progress Tracker.xlsx', size: '542 KB' },
];

export default function ChannelMediaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('media');

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.mediaItem} activeOpacity={0.8}>
      <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
      {item.type === 'video' && (
        <>
          <View style={styles.playIcon}>
            <Ionicons name="play" size={20} color={colors.white} />
          </View>
          {item.duration && (
            <View style={styles.duration}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );

  const renderFileItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.fileItem} activeOpacity={0.7}>
      <View style={styles.fileIcon}>
        <Ionicons name="document-text" size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileSize}>{item.size}</Text>
      </View>
      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="download-outline" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>Media & Files</Text>
          <Text style={styles.subtitle}>Wellness Daily</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'media' && styles.tabActive]}
          onPress={() => setActiveTab('media')}
        >
          <Text style={[styles.tabText, activeTab === 'media' && styles.tabTextActive]}>Media</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'files' && styles.tabActive]}
          onPress={() => setActiveTab('files')}
        >
          <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive]}>Files</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.tabActive]}
          onPress={() => setActiveTab('albums')}
        >
          <Text style={[styles.tabText, activeTab === 'albums' && styles.tabTextActive]}>Albums</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'media' && (
        <FlatList
          data={MOCK_MEDIA}
          keyExtractor={(item) => item.id}
          renderItem={renderMediaItem}
          numColumns={3}
          columnWrapperStyle={styles.mediaRow}
          contentContainerStyle={styles.mediaList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'files' && (
        <FlatList
          data={MOCK_FILES}
          keyExtractor={(item) => item.id}
          renderItem={renderFileItem}
          contentContainerStyle={styles.fileList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'albums' && (
        <View style={styles.emptyState}>
          <Ionicons name="albums-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>No albums yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  mediaList: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mediaRow: { gap: spacing.xs, marginBottom: spacing.xs },
  mediaItem: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  durationText: { fontSize: 10, fontWeight: '600', color: colors.white },
  fileList: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#FFE7CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  fileSize: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
});
