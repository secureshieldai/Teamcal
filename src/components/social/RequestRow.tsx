import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, radii, shadow, spacing } from '../../theme';
import type { MockMessageRequest } from '../../data/socialMockData';

type Props = {
  request: MockMessageRequest;
  onAccept?: () => void;
  onDecline?: () => void;
  onBlock?: () => void;
};

export default function RequestRow({ request, onAccept, onDecline, onBlock }: Props) {
  return (
    <View style={[styles.card, shadow.card]}>
      <Avatar uri={request.avatar} size={44} />
      <View style={styles.info}>
        <Text style={styles.name}>{request.name}</Text>
        <Text style={styles.meta}>{request.handle} {'\u{00B7}'} wants to message you</Text>
      </View>
      <TouchableOpacity style={styles.acceptButton} onPress={onAccept} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="checkmark" size={18} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.declineButton} onPress={onDecline} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onBlock} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.blockText}>Block</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
