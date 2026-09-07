import { FlatList, LayoutChangeEvent, RefreshControl, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';
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
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // Size each card to the ACTUAL visible area, not the full device height.
  // This feed renders inside the bottom tab navigator, whose tab bar shrinks the
  // content area. Using the window height made every card ~1 tab-bar taller than
  // the viewport, pushing the username / avatar / action counts off-screen behind
  // the tab bar. Fall back to window height until the first layout pass.
  const itemHeight = measuredHeight || height;

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - measuredHeight) > 1) {
      setMeasuredHeight(h);
    }
  }, [measuredHeight]);

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
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* No header bar — full-screen feed. Keep only a floating back button so
          users can leave (the app's bottom nav is hidden on this screen). */}
      {onBack && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.white} style={styles.backIcon} />
        </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
