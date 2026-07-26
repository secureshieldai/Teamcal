import React, { useState } from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { communityTabs } from '../data/communityData';
import { useCreatePost, useFeed, useGroups } from '../hooks/useCommunity';
import { useApiQuery } from '../hooks/useApiQuery';
import { socialService } from '../services/api/social.service';
import type { RootStackParamList } from '../navigation/types';

export default function CommunityScreen() {
  const [tab, setTab] = useState(communityTabs[0]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, loading: feedLoading, error: feedError, refetch } = useFeed();
  const { groups } = useGroups();
  const friends = useApiQuery(() => socialService.getFriends(), [], []);
  const creators = useApiQuery(() => socialService.getCreators(), [], []);
  const { createPost, loading: posting } = useCreatePost();
  const [draft, setDraft] = useState('');
  const publish = async () => { if (!draft.trim()) return; try { await createPost(draft.trim()); setDraft(''); await refetch(); } catch (e) { Alert.alert('Unable to post', (e as Error).message); } };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Text style={styles.pageTitle}>Community</Text>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={communityTabs} value={tab} onChange={setTab} variant="underline" />
      </View>

      {tab === 'Groups' ? (
        <View style={styles.list}>
          {groups.map((group) => <TouchableOpacity
            key={group.id || group.name}
            style={[styles.groupCard, shadow.card]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PowerSquad')}
          >
            <Avatar uri={group.avatar || ''} size={48} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.member_count} Members</Text>
            </View>
          </TouchableOpacity>)}
          {!groups.length && <Text style={styles.empty}>You have not joined any groups yet.</Text>}
        </View>
      ) : tab === 'Friends' ? (
        <FlatList data={friends.data} keyExtractor={x=>x.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>Add friends from Search to see them here.</Text>} renderItem={({item})=><View style={styles.personRow}><Avatar uri={item.avatar||''} size={46}/><View style={{flex:1}}><Text style={styles.groupName}>{item.name}</Text><Text style={styles.groupMeta}>Level {item.level}</Text></View><TouchableOpacity style={styles.outlineButton} onPress={async()=>{await socialService.toggleFriend(item.id);friends.refetch();}}><Text style={styles.outlineText}>Remove</Text></TouchableOpacity></View>}/>
      ) : tab === 'Creators' ? (
        <FlatList data={creators.data} keyExtractor={x=>x.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>No verified creators are available.</Text>} renderItem={({item})=><View style={styles.personRow}><Avatar uri={item.avatar||''} size={46}/><View style={{flex:1}}><Text style={styles.groupName}>{item.name}</Text><Text style={styles.groupMeta}>{item.bio||`Level ${item.level}`}</Text></View><TouchableOpacity style={[styles.outlineButton,item.following&&styles.following]} onPress={async()=>{await socialService.toggleFollow(item.id);creators.refetch();}}><Text style={[styles.outlineText,item.following&&{color:colors.white}]}>{item.following?'Following':'Follow'}</Text></TouchableOpacity></View>}/>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onComment={(postId) => navigation.navigate('Comments', { postId })} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<Text style={styles.empty}>{feedLoading ? 'Loading posts…' : feedError ? `Unable to load posts: ${feedError}` : 'No posts yet. Share the first update.'}</Text>}
          ListHeaderComponent={tab === 'Feed' ? <View style={styles.composer}><TextInput style={styles.composerInput} value={draft} onChangeText={setDraft} placeholder="Share an update…" multiline /><TouchableOpacity style={styles.postButton} onPress={publish} disabled={posting}><Text style={styles.postText}>{posting ? 'Posting…' : 'Post'}</Text></TouchableOpacity></View> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
  },
  composer: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  composerInput: { minHeight: 64, color: colors.textPrimary, textAlignVertical: 'top' },
  postButton: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  postText: { color: colors.white, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  outlineButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  outlineText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  following: { backgroundColor: colors.primary },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  groupInfo: {
    marginLeft: spacing.md,
  },
  groupName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
