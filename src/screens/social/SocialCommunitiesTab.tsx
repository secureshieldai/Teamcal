import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../../components/SearchBar';
import SegmentedControl from '../../components/SegmentedControl';
import SectionHeader from '../../components/SectionHeader';
import Avatar from '../../components/Avatar';
import SocialChannelsTab from './SocialChannelsTab';
import { colors, radii, shadow, spacing } from '../../theme';
import { communitiesSubTabs } from '../../data/communityData';
import { useDiscoverGroups, useGroups } from '../../hooks/useCommunity';
import type { RootStackParamList } from '../../navigation/types';
import {groupsService} from '../../services/api/groups.service';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  headerComponent?: React.ReactNode;
};

export default function SocialCommunitiesTab({ navigation, headerComponent }: Props) {
  const [subTab, setSubTab] = useState(communitiesSubTabs[0]);
  const [query, setQuery] = useState('');
  const { groups: myGroups,refetch:refetchMine } = useGroups();
  const { groups: discoverGroups, loading: discoverLoading, error: discoverError,refetch:refetchDiscover } = useDiscoverGroups();
  
  const changeSubTab = (nextTab: string) => {
    if (nextTab === 'Challenges') {
      navigation.navigate('Challenges');
      return;
    }
    setSubTab(nextTab);
  };

  const filteredDiscover = useMemo(
    () => discoverGroups.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())),
    [discoverGroups, query]
  );

  return (
    <View style={styles.flex}>
      {subTab === 'Channels' ? (
        <SocialChannelsTab navigation={navigation} headerComponent={headerComponent} />
      ) : subTab === 'Me' ? (
        <FlatList
          data={myGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {headerComponent}
              <View style={styles.subTabsWrap}>
                <SegmentedControl options={communitiesSubTabs} value={subTab} onChange={changeSubTab} variant="pill" />
              </View>
              <SectionHeader title="Your Groups" />
            </>
          }
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
              {headerComponent}
              <View style={styles.searchWrap}>
                <SearchBar placeholder="Search communities" value={query} onChangeText={setQuery} />
              </View>
              <View style={styles.subTabsWrap}>
                <SegmentedControl options={communitiesSubTabs} value={subTab} onChange={changeSubTab} variant="pill" />
              </View>

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
                onPress={() => navigation.navigate('CreateCommunity')}
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
    </View>  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  subTabsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
