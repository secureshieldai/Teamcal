import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, spacing } from '../theme';

type Props = {
  avatar: string;
  name: string;
  emoji: string;
  meta: string;
  time: string;
};

export default function FriendActivityRow({ avatar, name, emoji, meta, time }: Props) {
  return (
    <View style={styles.row}>
      <Avatar uri={avatar} size={40} />
      <View style={styles.info}>
        <Text style={styles.name}>
          {name} {emoji}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
      <TouchableOpacity style={styles.messageButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  messageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
