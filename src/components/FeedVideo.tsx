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
// Feed videos come in every shape (portrait phone clips, landscape, square).
// We size the frame to the video's own aspect ratio so nothing is cropped,
// clamped to a sane range so an extreme 9:16 clip doesn't eat the whole screen.
const MIN_ASPECT = 0.8; // 4:5 portrait
const MAX_ASPECT = 16 / 9; // widescreen
const DEFAULT_ASPECT = 1; // square, until the real size is known

function FeedVideo({
  uri,
  active,
  style,
  adaptAspect = true,
}: {
  uri: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  /** When true (default) the frame follows the video's own aspect ratio. */
  adaptAspect?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [aspect, setAspect] = useState<number | null>(null);
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
    const applySize = (size?: { width?: number; height?: number } | null) => {
      if (size?.width && size?.height) {
        const r = size.width / size.height;
        if (Number.isFinite(r) && r > 0) {
          setAspect(Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, r)));
        }
      }
    };
    const trackSub = player.addListener(
      'videoTrackChange',
      (e: { videoTrack?: { size?: { width?: number; height?: number } } | null }) => {
        applySize(e.videoTrack?.size);
      },
    );
    // In case the track is already resolved before the listener attaches.
    try { applySize((player as any).videoTrack?.size); } catch { /* not ready */ }
    return () => {
      playSub.remove();
      statusSub.remove();
      trackSub.remove();
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

  const aspectStyle = adaptAspect
    ? { aspectRatio: aspect ?? DEFAULT_ASPECT }
    : null;

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <View style={[styles.wrap, style, aspectStyle]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
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
