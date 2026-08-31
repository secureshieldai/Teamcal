import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import SegmentedControl from '../../components/SegmentedControl';
import ChatRow from '../../components/social/ChatRow';
import RequestRow from '../../components/social/RequestRow';
import { colors, spacing } from '../../theme';
import { chatsSubTabs } from '../../data/communityData';
import {socialService,type MessageRequest,type SocialConversation} from '../../services/api/social.service';
import type {RootStackParamList} from '../../navigation/types';

function labelFor(tab: string, requestCount: number) {
  return tab === 'Requests' && requestCount ? `Requests · ${requestCount}` : tab;
}

export default function SocialChatsTab({navigation}:{navigation:NativeStackNavigationProp<RootStackParamList>}) {
  const [subTab, setSubTab] = useState(chatsSubTabs[0]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [conversations,setConversations]=useState<SocialConversation[]>([]);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const load=useCallback(async()=>{try{const [items,pending]=await Promise.all([socialService.getConversations(),socialService.getMessageRequests()]);setConversations(items);setRequests(pending);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
  useFocusEffect(useCallback(()=>{load();},[load]));
  const action=async(request:MessageRequest,value:'accept'|'decline'|'block')=>{try{await socialService.actOnMessageRequest(request.user.id,value);setRequests(current=>current.filter(x=>x.id!==request.id));if(value==='accept'){await load();navigation.navigate('DirectMessage',{userId:request.user.id,name:request.user.name,avatar:request.user.avatar});}}catch(e){Alert.alert('Unable to update request',(e as Error).message);}};
  const labels = chatsSubTabs.map((t) => labelFor(t, requests.length));

  return (
    <View style={styles.flex}>
      <View style={styles.subTabsWrap}>
        <SegmentedControl
          options={labels}
          value={labelFor(subTab, requests.length)}
          onChange={(label) => setSubTab(chatsSubTabs[labels.indexOf(label)])}
          variant="pill"
        />
      </View>

      {subTab === 'Requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No pending message requests.</Text>}
          renderItem={({ item }) => (
            <RequestRow
              request={item}
              onAccept={() => action(item,'accept')}
              onDecline={() => action(item,'decline')}
              onBlock={() => action(item,'block')}
            />
          )}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<TouchableOpacity onPress={()=>navigation.navigate('GlobalSearch')}><Text style={styles.empty}>{loading?'Loading conversations…':error?`Unable to load chats: ${error}`:'No conversations yet. Tap to find someone.'}</Text></TouchableOpacity>}
          renderItem={({ item }) => <ChatRow conversation={item} onPress={()=>navigation.navigate('DirectMessage',{userId:item.user.id,name:item.user.name,avatar:item.user.avatar})} onPressProfile={()=>navigation.navigate('UserProfile',{userId:item.user.id,username:item.user.name})} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
});
