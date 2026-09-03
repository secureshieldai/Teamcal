import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, spacing } from '../../theme';
import VideoFeedCard, { type VideoFeedItem } from '../../components/social/VideoFeedCard';

type Props = {
  videos: VideoFeedItem[];
  loading: boolean;
  ListHeaderComponent?: React.ReactElement;
};

export default function VideoFeedTab({ videos, loading, ListHeaderComponent }: Props) {
  const { height } = useWindowDimensions();
  // Use full viewport height for TikTok-like experience
  const itemHeight = height;

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
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
      }}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      renderItem={({ item }) => (
        <View style={{ height: itemHeight }}>
          <VideoFeedCard video={item} height={itemHeight} />
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
