import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme';

/**
 * Inline feed video player (Facebook-style):
 *  - autoplays muted when the card is the active/visible one, pauses otherwise
 *  - single tap toggles play/pause and unmutes on first manual play
 *  - loops, no native controls
 * Rendering/playback only — no network or backend concerns here.
 */
function FeedVideo({
  uri,
  active,
  style,
}: {
  uri: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  // Whether the viewer has manually taken control (so autoplay/pause stops fighting them).
  const manual = useRef(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Drive playback from the `active` (visible) flag unless the user has taken over.
  useEffect(() => {
    if (!player || manual.current) return;
    try {
      if (active) player.play();
      else player.pause();
    } catch {
      /* player released */
    }
  }, [active, player]);

  useEffect(() => {
    if (!player) return;
    const playSub = player.addListener('playingChange', (e: { isPlaying: boolean }) => {
      setIsPlaying(e.isPlaying);
    });
    const statusSub = player.addListener(
      'statusChange',
      (e: { status: string }) => {
        if (e.status === 'readyToPlay') { setReady(true); setFailed(false); }
        else if (e.status === 'error') setFailed(true);
      },
    );
    return () => {
      playSub.remove();
      statusSub.remove();
    };
  }, [player]);

  const toggle = () => {
    if (!player) return;
    manual.current = true;
    try {
      if (isPlaying) {
        player.pause();
      } else {
        if (muted) { player.muted = false; setMuted(false); }
        player.play();
      }
    } catch {
      /* player released */
    }
  };

  const toggleMute = () => {
    if (!player) return;
    try {
      const next = !muted;
      player.muted = next;
      setMuted(next);
    } catch {
      /* player released */
    }
  };

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <View style={[styles.wrap, style]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />

        {!ready && !failed && (
          <View style={styles.overlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        )}

        {!isPlaying && ready && !failed && (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.playButton}>
              <Ionicons name="play" size={28} color="#fff" />
            </View>
          </View>
        )}

        {failed && (
          <View style={styles.overlay} pointerEvents="none">
            <Ionicons name="videocam-off-outline" size={28} color={colors.white} />
          </View>
        )}

        {ready && !failed && (
          <TouchableWithoutFeedback onPress={toggleMute}>
            <View style={styles.muteBtn}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

export default React.memo(FeedVideo);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  muteBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
