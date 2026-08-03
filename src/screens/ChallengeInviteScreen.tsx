import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../components/Avatar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { socialService, type LeaderboardUser } from '../services/api/social.service';
import { challengesService } from '../services/api/challenges.service';
import type { RootStackParamList } from '../navigation/types';
import { personalService } from '../services/api/personal.service';

const SHARE_CHANNELS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string; label: string }[] = [
  { key: 'link', icon: 'link-outline', color: colors.navy, label: 'Invite Link' },
  { key: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366', label: 'WhatsApp' },
  { key: 'messages', icon: 'chatbubble-outline', color: colors.primary, label: 'Messages' },
  { key: 'more', icon: 'ellipsis-horizontal', color: colors.textSecondary, label: 'More' },
];

export default function ChallengeInviteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChallengeInvite'>>();
  const { challengeId } = route.params;

  const [friends, setFriends] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [challengeTitle, setChallengeTitle] = useState('this challenge');

  useEffect(() => {
    (async () => {
      try {
        const [friendList, detail] = await Promise.all([socialService.getFriends(), challengesService.get(challengeId)]);
        setFriends(friendList);
        setChallengeTitle(detail.challenge.title);
      } catch (error) {
        Alert.alert('Could not load friends', (error as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [challengeId]);

  const filtered = useMemo(
    () => friends.filter((f) => !query.trim() || f.name.toLowerCase().includes(query.trim().toLowerCase())),
    [friends, query]
  );

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const shareMessage = `Join me in "${challengeTitle}" on TeamCal!`;

  const sendInvitations = async () => {
    try {
      await Promise.all(selected.map(friendId => personalService.create('challenge-invitation', { challengeId, friendId, challengeTitle, sentAt: Date.now() }, { externalKey: `${challengeId}:${friendId}`, status: 'pending' })));
      await Share.share({ message: shareMessage });
      navigation.goBack();
    } catch(error) { Alert.alert('Unable to send invitations',(error as Error).message); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Invite Friends</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search friends..." placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.map((friend) => {
            const active = selected.includes(friend.id);
            return (
              <TouchableOpacity key={friend.id} style={styles.friendRow} onPress={() => toggle(friend.id)}>
                <Avatar uri={friend.avatar ?? ''} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendHandle}>@{friend.name.toLowerCase().replace(/\s/g, '')}</Text>
                </View>
                <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                  {active && <Ionicons name="checkmark" size={13} color={colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && <Text style={styles.emptyText}>No friends found.</Text>}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.shareRow}>
          {SHARE_CHANNELS.map((channel) => (
            <TouchableOpacity key={channel.key} style={styles.shareItem} onPress={() => Share.share({ message: shareMessage })}>
              <View style={[styles.shareIcon, { backgroundColor: channel.color }]}>
                <Ionicons name={channel.icon} size={18} color={colors.white} />
              </View>
              <Text style={styles.shareLabel}>{channel.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.sendBtn, selected.length === 0 && styles.sendBtnDisabled]} onPress={sendInvitations} disabled={selected.length === 0}>
          <Text style={styles.sendBtnText}>Send Invitations ({selected.length})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  list: { padding: spacing.lg, gap: spacing.sm },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.soft },
  friendName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  friendHandle: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  shareRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  shareItem: { alignItems: 'center', gap: 6 },
  shareIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: colors.ringTrack },
  sendBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
