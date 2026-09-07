import { FlatList, RefreshControl, StyleSheet, Text, useWindowDimensions, View, ViewToken } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { colors, spacing } from '../../theme';
import VideoFeedCard, { type VideoFeedItem } from '../../components/social/VideoFeedCard';

type Props = {
  videos: VideoFeedItem[];
  loading: boolean;
  ListHeaderComponent?: React.ReactElement;
  onRefresh?: () => void;
  onEndReached?: () => void;
};

export default function VideoFeedTab({ videos, loading, ListHeaderComponent, onRefresh, onEndReached }: Props) {
  const { height } = useWindowDimensions();
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
  );
}

const styles = StyleSheet.create({
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
