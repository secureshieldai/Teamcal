import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../../components/SearchBar';
import SegmentedControl from '../../components/SegmentedControl';
import SectionHeader from '../../components/SectionHeader';
import Avatar from '../../components/Avatar';
import { colors, radii, shadow, spacing } from '../../theme';
import { communitiesSubTabs } from '../../data/communityData';
import { useDiscoverGroups, useGroups } from '../../hooks/useCommunity';
import { useChallenges } from '../../hooks/useChallenges';
import { challengesService } from '../../services/api/challenges.service';
import type { RootStackParamList } from '../../navigation/types';
import {groupsService} from '../../services/api/groups.service';
import CreateGroupModal from '../../components/social/CreateGroupModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function SocialCommunitiesTab({ navigation }: Props) {
  const [subTab, setSubTab] = useState(communitiesSubTabs[0]);
  const [query, setQuery] = useState('');
  const [createOpen,setCreateOpen]=useState(false);
  const { groups: myGroups,refetch:refetchMine } = useGroups();
  const { groups: discoverGroups, loading: discoverLoading, error: discoverError,refetch:refetchDiscover } = useDiscoverGroups();
  const { challenges, loading: challengesLoading } = useChallenges('discover');

  const filteredDiscover = useMemo(
    () => discoverGroups.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())),
    [discoverGroups, query]
  );

  return (
    <View style={styles.flex}>
      {subTab === 'Groups' ? (
        <View style={styles.searchWrap}>
          <SearchBar placeholder="Search communities" value={query} onChangeText={setQuery} />
        </View>
      ) : null}

      <View style={styles.subTabsWrap}>
        <SegmentedControl options={communitiesSubTabs} value={subTab} onChange={setSubTab} variant="pill" />
      </View>

      {subTab === 'Challenges' ? (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<SectionHeader title="Challenges" actionLabel="See All" onPressAction={() => navigation.navigate('Challenges')} />}
          ListEmptyComponent={<Text style={styles.empty}>{challengesLoading ? 'Loading challenges…' : 'No challenges to discover right now.'}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.groupCard, shadow.card]}
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  await challengesService.join(item.id);
                } catch (e) {
                  Alert.alert('Unable to join', (e as Error).message);
                }
              }}
            >
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.title}</Text>
                <Text style={styles.groupMeta}>{item.duration_days} days · {item.joined_count ?? 0} joined</Text>
              </View>
              <Text style={styles.openText}>Join</Text>
            </TouchableOpacity>
          )}
        />
      ) : subTab === 'Me' ? (
        <FlatList
          data={myGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<SectionHeader title="Your Groups" />}
          ListEmptyComponent={<Text style={styles.empty}>You have not joined any groups yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.groupCard, shadow.card]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PowerSquad',{groupId:item.id})}
            >
              <Avatar uri={item.avatar || ''} size={44} />
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>{item.member_count} Members</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={filteredDiscover}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <TouchableOpacity style={[styles.browseRow, shadow.card]} activeOpacity={0.85} onPress={() => navigation.navigate('PowerSquad')}>
                <View style={styles.flexInfo}>
                  <Text style={styles.groupName}>Browse all communities</Text>
                  <Text style={styles.groupMeta}>Official + user-created groups</Text>
                </View>
                <View style={styles.openButton}>
                  <Text style={styles.openButtonText}>Open</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createRow}
                activeOpacity={0.85}
                onPress={() => setCreateOpen(true)}
              >
                <View style={styles.createIcon}>
                  <Text style={styles.createIconText}>+</Text>
                </View>
                <View style={styles.flexInfo}>
                  <Text style={styles.groupName}>Create a community</Text>
                  <Text style={styles.groupMeta}>Free or paid · public or private</Text>
                </View>
              </TouchableOpacity>

              <SectionHeader title="TRENDING OFFICIAL" style={styles.trendingHeader} />
            </>
          }
          ListEmptyComponent={<Text style={styles.empty}>{discoverLoading ? 'Loading communities…' : discoverError ? `Unable to load: ${discoverError}` : 'No new communities to discover right now.'}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.groupCard, shadow.card]} activeOpacity={0.85} onPress={() => navigation.navigate('PowerSquad',{groupId:item.id})}>
              <Avatar uri={item.avatar || item.cover || ''} size={44} />
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>{item.member_count} members · Free</Text>
              </View>
              <TouchableOpacity style={styles.openButton} onPress={async(e)=>{e.stopPropagation();try{await groupsService.join(item.id);await Promise.all([refetchMine(),refetchDiscover()]);}catch(error){Alert.alert('Unable to join',(error as Error).message);}}}><Text style={styles.openButtonText}>Join</Text></TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
      <CreateGroupModal visible={createOpen} onClose={()=>setCreateOpen(false)} onCreated={()=>Promise.all([refetchMine(),refetchDiscover()]).then(()=>{})}/>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  subTabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  createIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIconText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  trendingHeader: {
    marginTop: spacing.xs,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  flexInfo: {
    flex: 1,
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
  openButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  openButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  openText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12.5,
  },
});
