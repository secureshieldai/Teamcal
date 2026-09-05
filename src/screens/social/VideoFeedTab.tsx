import { FlatList, StyleSheet, Text, useWindowDimensions, View, ViewToken } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { colors, spacing } from '../../theme';
import VideoFeedCard, { type VideoFeedItem } from '../../components/social/VideoFeedCard';

type Props = {
  videos: VideoFeedItem[];
  loading: boolean;
  ListHeaderComponent?: React.ReactElement;
};

export default function VideoFeedTab({ videos, loading, ListHeaderComponent }: Props) {
  const { height } = useWindowDimensions();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(videos[0]?.id || null);
  
  // Use full viewport height for Instagram Reels-like experience
  const itemHeight = height;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      // Get the first viewable item (the one most visible on screen)
      const activeItem = viewableItems[0];
      if (activeItem?.item?.id && activeItem.item.id !== activeVideoId) {
        setActiveVideoId(activeItem.item.id);
      }
    }
  }, [activeVideoId]);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 80,
        minimumViewTime: 100,
        waitForInteraction: false,
      },
      onViewableItemsChanged,
    },
  ]);

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
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      decelerationRate="fast"
      snapToInterval={itemHeight}
      snapToAlignment="start"
      ListHeaderComponent={ListHeaderComponent}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      removeClippedSubviews
      maxToRenderPerBatch={2}
      windowSize={5}
      initialNumToRender={2}
      renderItem={({ item }) => (
        <View style={{ height: itemHeight }}>
          <VideoFeedCard 
            video={item} 
            height={itemHeight} 
            isActive={item.id === activeVideoId}
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
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
