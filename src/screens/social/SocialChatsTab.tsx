import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import SegmentedControl from '../../components/SegmentedControl';
import ChatRow from '../../components/social/ChatRow';
import RequestRow from '../../components/social/RequestRow';
import { colors, spacing } from '../../theme';
import { chatsSubTabs } from '../../data/communityData';
import { mockConversations, mockMessageRequests } from '../../data/socialMockData';

function labelFor(tab: string, requestCount: number) {
  return tab === 'Requests' && requestCount ? `Requests · ${requestCount}` : tab;
}

export default function SocialChatsTab() {
  const [subTab, setSubTab] = useState(chatsSubTabs[0]);
  const [requests, setRequests] = useState(mockMessageRequests);
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
              onAccept={() => setRequests((prev) => prev.filter((r) => r.id !== item.id))}
              onDecline={() => setRequests((prev) => prev.filter((r) => r.id !== item.id))}
              onBlock={() => setRequests((prev) => prev.filter((r) => r.id !== item.id))}
            />
          )}
        />
      ) : (
        <FlatList
          data={mockConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ChatRow conversation={item} />}
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
