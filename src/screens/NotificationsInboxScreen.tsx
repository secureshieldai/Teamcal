import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApiQuery } from '../hooks/useApiQuery';
import { AppNotification, notificationsService } from '../services/api/notifications.service';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { like: 'heart', comment: 'chatbubble', friend: 'person-add', follow: 'people', connect_request: 'person-add', connect_accepted: 'people-circle', message: 'chatbubble-ellipses', order: 'bag-handle', reward: 'gift' };

export default function NotificationsInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useApiQuery(() => notificationsService.getNotifications(), { success: true, notifications: [], unreadCount: 0 }, []);
  useFocusEffect(useCallback(() => { query.refetch(); }, [query.refetch]));
  useEffect(() => { const timer = setInterval(query.refetch, 15_000); return () => clearInterval(timer); }, [query.refetch]);
  const open = async (item: AppNotification) => {
    if (!item.read) { await notificationsService.markRead(item.id); query.refetch(); }
    if (item.type === 'connect_request' || item.type === 'connect_accepted') navigation.navigate('Connections');
  };
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary}/></TouchableOpacity><Text style={styles.title}>Notifications</Text><TouchableOpacity disabled={!query.data.unreadCount} onPress={async()=>{await notificationsService.markAllRead();query.refetch();}}><Text style={[styles.mark, !query.data.unreadCount && styles.disabled]}>Mark all read</Text></TouchableOpacity></View>
    {query.loading ? <ActivityIndicator style={{marginTop:40}} color={colors.primary}/> : <FlatList data={query.data.notifications} keyExtractor={(item)=>String(item.id)} contentContainerStyle={styles.list} refreshing={query.loading} onRefresh={query.refetch} ListEmptyComponent={<View style={styles.empty}><Ionicons name="notifications-off-outline" size={38} color={colors.textSecondary}/><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptyText}>Likes, comments, friends, orders and rewards will appear here.</Text></View>} renderItem={({item})=><TouchableOpacity style={[styles.card,!item.read&&styles.unread]} onPress={()=>open(item)}><View style={styles.icon}><Ionicons name={icons[item.type] || 'notifications'} size={20} color={colors.primary}/></View><View style={{flex:1}}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.message}>{item.message}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text></View>{!item.read&&<View style={styles.dot}/>}</TouchableOpacity>}/>} 
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg},title:{...typography.h2,color:colors.textPrimary},mark:{color:colors.primary,fontWeight:'700',fontSize:12},disabled:{opacity:.35},list:{padding:spacing.lg,paddingTop:0,flexGrow:1},card:{flexDirection:'row',gap:spacing.md,backgroundColor:colors.card,borderRadius:radii.lg,padding:spacing.md,marginBottom:spacing.sm},unread:{borderLeftWidth:3,borderLeftColor:colors.primary},icon:{width:40,height:40,borderRadius:20,backgroundColor:'#FFEDE3',alignItems:'center',justifyContent:'center'},itemTitle:{fontWeight:'700',color:colors.textPrimary},message:{color:colors.textSecondary,fontSize:13,marginTop:2},time:{color:colors.textSecondary,fontSize:10,marginTop:6},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.primary},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:40},emptyTitle:{...typography.h2,marginTop:spacing.md},emptyText:{color:colors.textSecondary,textAlign:'center',marginTop:spacing.sm}});
