import React, { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number; percentage: number }[];
  totalVotes: number;
  userVoted: boolean;
  userVoteId?: string;
  author: { name: string; avatar?: string | null };
  createdAt: string;
};

const MOCK_POLLS: Poll[] = [
  {
    id: '1',
    question: "What's your biggest wellness goal this month?",
    options: [
      { id: 'a', text: 'Better sleep', votes: 124, percentage: 45 },
      { id: 'b', text: 'Eat healthier', votes: 89, percentage: 32 },
      { id: 'c', text: 'Exercise more', votes: 63, percentage: 23 },
    ],
    totalVotes: 276,
    userVoted: false,
    author: { name: 'Wellness Daily', avatar: null },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    question: 'Favorite time to workout?',
    options: [
      { id: 'a', text: 'Morning', votes: 156, percentage: 62 },
      { id: 'b', text: 'Afternoon', votes: 48, percentage: 19 },
      { id: 'c', text: 'Evening', votes: 48, percentage: 19 },
    ],
    totalVotes: 252,
    userVoted: true,
    userVoteId: 'a',
    author: { name: 'Wellness Daily', avatar: null },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function ChannelPollScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        if (poll.userVoted) {
          Alert.alert('Already Voted', 'You can only vote once per poll');
          return poll;
        }

        const newVotes = poll.totalVotes + 1;
        const updatedOptions = poll.options.map((opt) => {
          const votes = opt.id === optionId ? opt.votes + 1 : opt.votes;
          return { ...opt, votes, percentage: Math.round((votes / newVotes) * 100) };
        });

        return { ...poll, options: updatedOptions, totalVotes: newVotes, userVoted: true, userVoteId: optionId };
      })
    );
  };

  const renderPoll = ({ item: poll }: { item: Poll }) => (
    <View style={[styles.pollCard, shadow.soft]}>
      <View style={styles.pollHeader}>
        <Avatar uri={poll.author.avatar ?? ''} size={40} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.authorName}>{poll.author.name}</Text>
          <Text style={styles.pollTime}>{new Date(poll.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      <View style={styles.optionsContainer}>
        {poll.options.map((option) => {
          const isSelected = poll.userVoted && poll.userVoteId === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleVote(poll.id, option.id)}
              disabled={poll.userVoted}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.text}</Text>
                {poll.userVoted && (
                  <Text style={[styles.optionPercentage, isSelected && styles.optionPercentageSelected]}>
                    {option.percentage}%
                  </Text>
                )}
              </View>
              {poll.userVoted && (
                <View style={[styles.progressBar, { width: `${option.percentage}%` }]}>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.pollFooter}>
        <View style={styles.reactionRow}>
          <Ionicons name="thumbs-up-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reactionText}>{poll.totalVotes}</Text>
        </View>
        <View style={styles.reactionRow}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reactionText}>32</Text>
        </View>
        <View style={styles.reactionRow}>
          <Ionicons name="share-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reactionText}>8</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>Poll in Channel</Text>
          <Text style={styles.subtitle}>Wellness Daily</Text>
        </View>
      </View>

      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        renderItem={renderPoll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pollCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pollHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  pollTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  question: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, lineHeight: 22, marginBottom: spacing.lg },
  optionsContainer: { gap: spacing.md, marginBottom: spacing.lg },
  option: {
    position: 'relative',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  optionSelected: { borderColor: colors.primary },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  optionText: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  optionTextSelected: { fontWeight: '600' },
  optionPercentage: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  optionPercentageSelected: { color: colors.primary },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFE7CF',
    zIndex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: spacing.sm,
  },
  pollFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reactionText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
