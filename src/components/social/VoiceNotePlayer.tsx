import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, radii, spacing } from '../../theme';

function fmt(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Inline player for a voice message bubble. `mine` flips the palette for the sender's side. */
export default function VoiceNotePlayer({ uri, durationMs, mine, transcript }: { uri: string; durationMs?: number | null; mine?: boolean; transcript?: string | null }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const total = status.duration || (durationMs ? durationMs / 1000 : 0);
  const current = status.currentTime || 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;
  const fg = mine ? colors.white : colors.primary;
  const track = mine ? 'rgba(255,255,255,0.35)' : colors.border;

  const bars = useMemo(() => Array.from({ length: 22 }, () => 0.35 + Math.random() * 0.65), [uri]);

  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || current >= total) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity onPress={toggle} style={[styles.playBtn, { borderColor: fg }]}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={16} color={fg} />
        </TouchableOpacity>
        <View style={styles.waveform}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={{
                width: 2.5,
                height: 22 * h,
                borderRadius: 2,
                backgroundColor: i / bars.length <= progress ? fg : track,
              }}
            />
          ))}
        </View>
        <Text style={[styles.time, { color: fg }]}>{fmt(status.playing || current > 0 ? current : total)}</Text>
      </View>
      {transcript ? <Text style={[styles.transcript, mine && styles.transcriptMine]}>“{transcript}”</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, minWidth: 190 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  time: { fontSize: 10.5, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  transcript: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary },
  transcriptMine: { color: 'rgba(255,255,255,0.85)' },
});
