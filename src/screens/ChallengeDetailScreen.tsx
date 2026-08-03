import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../components/Avatar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { challengesService } from '../services/api/challenges.service';
import { challengeTypes } from '../data/challengesData';
import { useAuth } from '../context/AuthContext';
import type { Challenge, ChallengeMember, ChallengeMembership } from '../types/api';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackNavigationProp<RootStackParamList>;

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<Props>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChallengeDetail'>>();
  const { user } = useAuth();
  const { challengeId } = route.params;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [membership, setMembership] = useState<ChallengeMembership | null>(null);
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, memberList] = await Promise.all([challengesService.get(challengeId), challengesService.getMembers(challengeId)]);
      setChallenge(detail.challenge);
      setMembership(detail.membership);
      setMembers(memberList);
    } catch {
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleJoin = async () => {
    setBusy(true);
    try {
      await challengesService.join(challengeId);
      await load();
    } catch (error) {
      Alert.alert('Could not join challenge', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = () => {
    setMenuOpen(false);
    Alert.alert('Leave challenge?', 'You will lose your current progress in this challenge.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await challengesService.leave(challengeId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Could not leave challenge', (error as Error).message);
          }
        },
      },
    ]);
  };

  const share = () => Share.share({ message: `Join me in "${challenge?.title}" on TeamCal!` });

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
        <Text style={styles.errorText}>Couldn't load this challenge.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const type = challengeTypes.find((t) => t.id === challenge.challenge_type);
  const unit = challenge.goal_unit || type?.unit || 'days';
  const goalTotal = challenge.goal_target ?? challenge.total_days;
  const currentDay = membership?.current_day ?? 0;
  const currentMetric = Math.round((currentDay / (challenge.total_days || 1)) * goalTotal);
  const percent = Math.min(100, Math.round((currentDay / (challenge.total_days || 1)) * 100));
  const daysLeft = challenge.ends_at ? Math.max(0, Math.ceil((challenge.ends_at - Date.now()) / 86_400_000)) : Math.max(0, challenge.total_days - currentDay);
  const completedCount = members.filter((m) => m.completed).length;
  const inProgressCount = members.length - completedCount;
  const visibleMembers = showAllMembers ? members : members.slice(0, 5);
  const myRank = members.findIndex((m) => m.id === user?.id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Image source={{ uri: challenge.photo ?? undefined }} style={styles.cover} />
          <View style={styles.coverHeader}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
            </Text>
            <TouchableOpacity onPress={share} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {challenge.starts_at ? new Date(challenge.starts_at).toLocaleDateString() : ''}
              {challenge.ends_at ? ` – ${new Date(challenge.ends_at).toLocaleDateString()}` : ''}
            </Text>
            <View style={styles.daysLeftBadge}>
              <Text style={styles.daysLeftText}>{daysLeft} Days Left</Text>
            </View>
          </View>

          {membership ? (
            <>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={[styles.card, shadow.card]}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressText}>
                    {currentMetric.toLocaleString()} / {goalTotal.toLocaleString()} {unit}
                  </Text>
                  <Text style={styles.percentText}>{percent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={busy}>
              <Text style={styles.joinBtnText}>{busy ? 'Joining…' : 'Join Challenge'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{challenge.joined_count}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{inProgressCount}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            {members.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllMembers((v) => !v)}>
                <Text style={styles.viewAll}>{showAllMembers ? 'Show less' : 'View all'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.card, shadow.card]}>
            {visibleMembers.map((member, index) => {
              const isMe = member.id === user?.id;
              return (
                <View key={member.id} style={[styles.leaderRow, isMe && styles.leaderRowActive, index === visibleMembers.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.leaderRank}>{index + 1}</Text>
                  <Avatar uri={member.avatar ?? ''} size={30} />
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {isMe ? 'You' : member.name}
                  </Text>
                  <Text style={styles.leaderMetric}>
                    {Math.round((member.current_day / (challenge.total_days || 1)) * goalTotal).toLocaleString()} {unit}
                  </Text>
                </View>
              );
            })}
            {members.length === 0 && <Text style={styles.emptyText}>No participants yet.</Text>}
          </View>
          {myRank >= 0 && <Text style={styles.rankHint}>You're ranked #{myRank + 1} of {members.length}</Text>}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('ChallengeInvite', { challengeId })}>
          <Ionicons name="people-outline" size={16} color={colors.textPrimary} />
          <Text style={styles.bottomBtnText}>Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnPrimary]} onPress={share}>
          <Ionicons name="share-social-outline" size={16} color={colors.white} />
          <Text style={styles.bottomBtnTextPrimary}>Share</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheet}>
            <MenuRow icon="create-outline" title="Edit Challenge" subtitle="Update challenge details" onPress={() => { setMenuOpen(false); navigation.navigate('CreateChallenge',{challengeId}); }} />
            <MenuRow icon="share-social-outline" title="Share Challenge" subtitle="Share with more people" onPress={() => { setMenuOpen(false); share(); }} />
            <MenuRow icon="people-outline" title="Invite Friends" subtitle="Invite more participants" onPress={() => { setMenuOpen(false); navigation.navigate('ChallengeInvite', { challengeId }); }} />
            <MenuRow
              icon="document-text-outline"
              title="Challenge Rules"
              subtitle="View challenge rules"
              onPress={() => { setMenuOpen(false); Alert.alert('Challenge Rules', challenge.rules || 'No rules have been added for this challenge.'); }}
            />
            {membership && (
              <MenuRow icon="exit-outline" title="Leave Challenge" subtitle="Exit this challenge" destructive onPress={handleLeave} last />
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuRow, !last && styles.menuRowBorder]} onPress={onPress}>
      <Ionicons name={icon} size={19} color={destructive ? colors.macroProtein : colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuRowTitle, destructive && { color: colors.macroProtein }]}>{title}</Text>
        <Text style={styles.menuRowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: spacing.md, padding: spacing.xl },
  errorText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  content: { paddingBottom: 100 },
  cover: { width: '100%', height: 200, backgroundColor: colors.border },
  coverHeader: { position: 'absolute', top: spacing.md, left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.h1, fontSize: 20, color: colors.textPrimary, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' },
  dateText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  daysLeftBadge: { backgroundColor: '#FFEDE3', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm },
  daysLeftText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  percentText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  joinBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.xl, marginTop: spacing.lg, paddingVertical: spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
  viewAll: { fontSize: 12, fontWeight: '700', color: colors.primary },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  leaderRowActive: { backgroundColor: '#FFF6F1', marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  leaderRank: { width: 18, fontSize: 12.5, fontWeight: '800', color: colors.textSecondary },
  leaderName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  leaderMetric: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '700' },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  rankHint: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md },
  bottomBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  bottomBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  bottomBtnTextPrimary: { fontSize: 13, fontWeight: '700', color: colors.white },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuRowTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  menuRowSubtitle: { fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
});
