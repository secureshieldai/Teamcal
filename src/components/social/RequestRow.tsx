import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, radii, shadow, spacing } from '../../theme';
import type { MessageRequest } from '../../services/api/social.service';

type Props = {
  request: MessageRequest;
  onOpen?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onBlock?: () => void;
};

export default function RequestRow({ request, onOpen, onAccept, onDecline, onBlock }: Props) {
  const limit = request.messageLimit || 3;
  const used = Math.min(request.messageCount ?? 0, limit);
  const atLimit = used >= limit;

  return (
    <View style={[styles.card, shadow.card]}>
      <TouchableOpacity style={styles.top} activeOpacity={0.8} onPress={onOpen}>
        <Avatar uri={request.user.avatar || ''} size={44} />
        <View style={styles.info}>
          <Text style={styles.name}>{request.user.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{request.summary || 'Wants to send you a message'}</Text>
          <View style={styles.statusRow}>
            <View style={styles.dots}>
              {Array.from({ length: limit }).map((_, i) => (
                <View key={i} style={[styles.dot, i < used && styles.dotFilled]} />
              ))}
            </View>
            <Text style={[styles.statusText, atLimit && styles.statusTextLimit]}>
              {atLimit ? `Limit reached · ${used}/${limit}` : `${used} of ${limit} messages used`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Ionicons name="checkmark" size={16} color={colors.white} />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBlock} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.blockText}>Block</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotFilled: { backgroundColor: colors.primary },
  statusText: { fontSize: 10.5, fontWeight: '600', color: colors.textSecondary },
  statusTextLimit: { color: colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  declineButton: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  declineText: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },
  blockText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    marginLeft: 'auto',
  },
});
