import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { DirectMessage } from '../../services/api/social.service';
import VoiceNotePlayer from './VoiceNotePlayer';

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function callSummary(m: DirectMessage) {
  const label = m.call?.mode === 'video' ? 'Video call' : 'Voice call';
  const outcome = m.call?.outcome;
  if (outcome === 'missed' || outcome === 'no_answer') return `Missed ${label.toLowerCase()}`;
  if (outcome === 'declined') return `Declined ${label.toLowerCase()}`;
  if (outcome === 'cancelled') return `Cancelled ${label.toLowerCase()}`;
  const d = m.call?.durationS || 0;
  return d ? `${label} · ${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}` : label;
}

export default function MessageBubble({ message, onPressImage }: { message: DirectMessage; onPressImage?: (url: string) => void }) {
  const mine = message.mine;

  if (message.type === 'call') {
    return (
      <View style={styles.callRow}>
        <Ionicons
          name={message.call?.mode === 'video' ? 'videocam' : 'call'}
          size={14}
          color={message.call?.outcome === 'missed' ? '#E5484D' : colors.textSecondary}
        />
        <Text style={styles.callText}>{callSummary(message)}</Text>
        <Text style={styles.callTime}>{clockTime(message.createdAt)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, message.type === 'image' && styles.imageBubble]}>
      {message.type === 'image' && message.mediaUrl ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage?.(message.mediaUrl as string)}>
          <Image source={{ uri: message.mediaUrl }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      ) : message.type === 'voice' && message.mediaUrl ? (
        <VoiceNotePlayer uri={message.mediaUrl} durationMs={message.durationMs} mine={mine} transcript={message.transcript} />
      ) : (
        <Text style={[styles.text, mine && styles.textMine]}>{message.text}</Text>
      )}
      <View style={styles.metaRow}>
        <Text style={[styles.time, mine && styles.timeMine]}>{clockTime(message.createdAt)}</Text>
        {mine ? (
          <Ionicons
            name={message.read ? 'checkmark-done' : 'checkmark'}
            size={13}
            color={message.read ? '#8ED0FF' : 'rgba(255,255,255,0.7)'}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.xl },
  imageBubble: { padding: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  text: { color: colors.textPrimary, fontSize: 14.5, lineHeight: 20 },
  textMine: { color: colors.white },
  image: { width: 220, height: 220, borderRadius: radii.lg, backgroundColor: colors.border },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  time: { fontSize: 9, color: colors.textMuted },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  callRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  callText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  callTime: { fontSize: 10, color: colors.textMuted },
});
