import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import VideoFeedCard, { type VideoFeedItem } from '../../components/social/VideoFeedCard';

type Props = {
  videos: VideoFeedItem[];
  loading: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onBack?: () => void;
};

export default function VideoFeedTab({ videos, loading, onRefresh, onEndReached, onBack }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use full viewport height for TikTok/Reels-like experience
  const itemHeight = height;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      // Get the most visible item
      const activeItem = viewableItems[0];
      if (activeItem?.index !== null && activeItem.index !== undefined) {
        setActiveVideoIndex(activeItem.index);
      }
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  if (!loading && videos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No videos yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating header with back button */}
      {onBack && (
        <View style={[styles.floatingHeader, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Videos</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <FlatList
      data={videos}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      decelerationRate="fast"
      snapToInterval={itemHeight}
      snapToAlignment="start"
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.white}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      renderItem={({ item, index }) => (
        <View style={{ height: itemHeight }}>
          <VideoFeedCard 
            video={item} 
            height={itemHeight} 
            isActive={index === activeVideoIndex}
          />
        </View>
      )}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  empty: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  emptyText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
