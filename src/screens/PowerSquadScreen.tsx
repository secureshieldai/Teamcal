import React,{useState} from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import Avatar from '../components/Avatar';
import SectionHeader from '../components/SectionHeader';
import { colors, radii, shadow, spacing } from '../theme';
import { powerSquad, groupActions, groupActivity } from '../data/powerSquadData';
import type {RootStackParamList} from '../navigation/types';
import {useApiQuery} from '../hooks/useApiQuery';
import {groupsService} from '../services/api/groups.service';
import {postsService} from '../services/api/posts.service';

export default function PowerSquadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route=useRoute<RouteProp<RootStackParamList,'PowerSquad'>>();const groupId=route.params?.groupId;
  const detail=useApiQuery(()=>groupId?groupsService.get(groupId):Promise.resolve(null),null,[groupId]);
  const activity=useApiQuery(()=>groupId?groupsService.getActivity(groupId):Promise.resolve([]),[],[groupId]);
  const real=detail.data;
  const display=real?{cover:real.group.cover||'',name:real.group.name,description:real.group.description,memberCount:real.group.member_count,members:real.members.map(x=>x.user.avatar||'').filter(Boolean)}:powerSquad;
  const activities=real?activity.data.map(post=>({id:post.id,avatar:post.user?.avatar||'',name:post.user?.name||'Member',time:new Date(post.created_at).toLocaleString(),caption:post.text,likes:post.likes,comments:0})):groupActivity;
  const [draft,setDraft]=useState('');const publish=async()=>{if(!groupId||!draft.trim())return;try{await postsService.create({text:draft.trim(),community:groupId});setDraft('');await activity.refetch();}catch(e){Alert.alert('Unable to post',(e as Error).message);}};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{display.name}</Text>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: display.cover }} style={styles.cover} />

        <View style={styles.body}>
          <View style={styles.avatarStack}>
            {display.members.slice(0,4).map((uri, i) => (
              <View key={uri} style={[styles.avatarStackItem, { marginLeft: i === 0 ? 0 : -14 }]}>
                <Avatar uri={uri} size={40} />
              </View>
            ))}
            <View style={[styles.avatarStackMore, { marginLeft: -14 }]}>
              <Text style={styles.avatarStackMoreText}>+{Math.max(0,display.memberCount - Math.min(4,display.members.length))}</Text>
            </View>
          </View>

          <Text style={styles.groupName}>{display.name}</Text>
          <Text style={styles.groupMeta}>{real?.group.is_private?'Private':'Public'} Group • {display.memberCount} Members</Text>
          <Text style={styles.groupDescription}>{display.description}</Text>
          {groupId?<TouchableOpacity style={styles.membershipButton} onPress={async()=>{try{if(real?.myRole)await groupsService.leave(groupId);else await groupsService.join(groupId);await detail.refetch();}catch(e){Alert.alert('Unable to update membership',(e as Error).message);}}}><Text style={styles.membershipButtonText}>{real?.myRole?'Leave Community':'Join Community'}</Text></TouchableOpacity>:null}

          <View style={styles.actionsRow}>
            {groupActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.actionItem} activeOpacity={0.75} onPress={()=>{if(action.id==='workouts')navigation.navigate('Workouts');if(action.id==='challenges')navigation.navigate('Challenges');if(action.id==='leaderboards')navigation.navigate('Leaderboards');}}>
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {groupId&&real?.myRole?<View style={styles.composer}><TextInput style={styles.composerInput} value={draft} onChangeText={setDraft} placeholder="Share with this community…"/><TouchableOpacity style={styles.composerButton} onPress={publish}><Text style={styles.composerButtonText}>Post</Text></TouchableOpacity></View>:null}

          <SectionHeader title="Group Activity" style={{ marginTop: spacing.xl }} />
          {activities.map((activity) => (
            <View key={activity.id} style={[styles.activityCard, shadow.card]}>
              <View style={styles.activityHeader}>
                <Avatar uri={activity.avatar} size={36} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>
                    {activity.name} <Text style={styles.activityAction}>completed a workout</Text>
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
              </View>
              <Text style={styles.activityCaption}>{activity.caption}</Text>
              <View style={styles.activityFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.footerText}>{activity.likes}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.footerText}>{activity.comments}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cover: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -32,
  },
  avatarStackItem: {
    borderWidth: 2.5,
    borderColor: colors.background,
    borderRadius: 22,
  },
  avatarStackMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  avatarStackMoreText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groupDescription: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipButton:{alignSelf:'flex-start',backgroundColor:colors.primary,borderRadius:radii.pill,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm,marginTop:spacing.md},membershipButtonText:{color:colors.white,fontWeight:'800'},
  composer:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.lg,backgroundColor:colors.card,borderRadius:radii.xl,padding:spacing.sm},
  composerInput:{flex:1,paddingHorizontal:spacing.sm,color:colors.textPrimary},
  composerButton:{backgroundColor:colors.primary,borderRadius:radii.pill,paddingHorizontal:spacing.lg,justifyContent:'center'},
  composerButtonText:{color:colors.white,fontWeight:'800'},
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activityAction: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  activityCaption: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  activityFooter: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
