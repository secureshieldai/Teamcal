import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import SectionHeader from './SectionHeader';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = {
  avatar: string;
  name: string;
  online?: boolean;
  verified?: boolean;
  myLastMessage: string;
  time: string;
  coachReply: string;
  unreadCount?: number;
  onOpenChat?: () => void;
};

export default function CoachChatCard({
  avatar,
  name,
  online,
  verified,
  myLastMessage,
  time,
  coachReply,
  unreadCount,
  onOpenChat,
}: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Chat with Your Coach" />

      <View style={[styles.card, shadow.card]}>
        <View style={styles.topRow}>
          <Avatar uri={avatar} size={44} online={online} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {verified && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
            </View>
            <Text style={styles.status}>{online ? 'Online' : 'Offline'}</Text>
          </View>
          {!!unreadCount && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.messages}>
          <Text style={styles.messageLine} numberOfLines={1}>
            <Text style={styles.sender}>You: </Text>
            {myLastMessage}
            <Text style={styles.time}>  {time}</Text>
          </Text>
          <Text style={styles.messageLine} numberOfLines={1}>
            <Text style={styles.sender}>Coach: </Text>
            {coachReply}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onOpenChat} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Open Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  status: {
    ...typography.small,
    color: colors.success,
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  messages: {
    marginTop: spacing.md,
    gap: 6,
  },
  messageLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sender: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    ...typography.bodyBold,
  },
});
