import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type Props = {
  text: string;
  time: string;
  fromMe?: boolean;
  seen?: boolean;
};

export default function ChatBubble({ text, time, fromMe, seen }: Props) {
  return (
    <View style={[styles.wrap, fromMe ? styles.wrapMe : styles.wrapThem]}>
      <View style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.text, fromMe && styles.textMe]}>{text}</Text>
      </View>
      <View style={[styles.metaRow, fromMe && styles.metaRowMe]}>
        <Text style={styles.time}>{time}</Text>
        {fromMe && seen ? <Ionicons name="checkmark-done" size={14} color={colors.primary} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '78%',
    marginBottom: spacing.md,
  },
  wrapThem: {
    alignSelf: 'flex-start',
  },
  wrapMe: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleThem: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  textMe: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  metaRowMe: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
