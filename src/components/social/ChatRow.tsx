import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, radii, shadow, spacing } from '../../theme';
import type { SocialConversation } from '../../services/api/social.service';

export default function ChatRow({ conversation, onPress, onPressProfile }: { conversation: SocialConversation; onPress?: () => void; onPressProfile?: () => void }) {
  return (
    <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.85} onPress={onPress}>
      <TouchableOpacity disabled={!onPressProfile} onPress={onPressProfile} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Avatar uri={conversation.user.avatar||''} size={52} />
      </TouchableOpacity>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} onPress={onPressProfile}>{conversation.user.name}</Text>
        </View>
        <Text style={styles.summary}>{conversation.summary}</Text>
      </View>
      {conversation.unreadCount ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakPill: {
    backgroundColor: '#FFEDE3',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
  },
  summary: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
