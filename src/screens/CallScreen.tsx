import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { socialService } from '../services/api/social.service';
import { subscribeToCallSignals } from '../services/realtime';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Call'>;
type Status = 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'unanswered';

const RING_TIMEOUT_MS = 30_000;

function fmt(totalS: number) {
  const s = Math.max(0, Math.floor(totalS));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function CallScreen({ route, navigation }: Props) {
  const { userId, name, avatar, mode, direction } = route.params;
  const { user } = useAuth();

  const callId = useMemo(() => route.params.callId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, [route.params.callId]);
  const [status, setStatus] = useState<Status>(direction === 'incoming' ? 'ringing' : 'connecting');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(mode === 'video');

  const send = useRef<(event: string, payload: Record<string, unknown>) => void>(() => undefined as void);
  const connectedAt = useRef<number | null>(null);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const invited = useRef(false);

  const close = useCallback(
    (outcome: 'ended' | 'declined' | 'missed' | 'no_answer' | 'cancelled', finalStatus: Status) => {
      if (closing.current) return;
      closing.current = true;
      if (ringTimer.current) clearTimeout(ringTimer.current);
      setStatus(finalStatus);
      const durationS = connectedAt.current ? (Date.now() - connectedAt.current) / 1000 : 0;
      // Only the caller writes the call-history row so it is not double-counted.
      if (direction === 'outgoing') {
        socialService.logCall(userId, { mode, outcome, durationS }).catch(() => undefined);
      }
      setTimeout(() => navigation.goBack(), 700);
    },
    [direction, mode, navigation, userId],
  );

  const goConnected = useCallback(() => {
    if (ringTimer.current) clearTimeout(ringTimer.current);
    connectedAt.current = Date.now();
    setStatus('connected');
  }, []);

  // Signaling wiring.
  useEffect(() => {
    let unsub = () => undefined as void;
    subscribeToCallSignals((signal) => {
      if ('callId' in signal && signal.callId !== callId) return;
      if (signal.fromUserId !== userId) return;
      if (signal.event === 'call:accept') goConnected();
      else if (signal.event === 'call:decline') close('declined', 'declined');
      else if (signal.event === 'call:end') close('ended', 'ended');
    }).then((s) => {
      send.current = s.send;
      unsub = s.unsubscribe;
      if (direction === 'outgoing' && !invited.current) {
        invited.current = true;
        s.send('call:invite', {
          toUserId: userId,
          callId,
          mode,
          name: user?.name ?? 'Someone',
          avatar: user?.avatar ?? null,
        });
        ringTimer.current = setTimeout(() => {
          s.send('call:end', { toUserId: userId, callId });
          close('no_answer', 'unanswered');
        }, RING_TIMEOUT_MS);
      }
    });
    return () => {
      if (ringTimer.current) clearTimeout(ringTimer.current);
      unsub();
    };
  }, [callId, direction, mode, userId, user, goConnected, close]);

  // In-call timer.
  useEffect(() => {
    if (status !== 'connected') return;
    const id = setInterval(() => {
      if (connectedAt.current) setElapsed((Date.now() - connectedAt.current) / 1000);
    }, 500);
    return () => clearInterval(id);
  }, [status]);

  const acceptIncoming = () => {
    send.current('call:accept', { toUserId: userId, callId });
    goConnected();
  };
  const declineIncoming = () => {
    send.current('call:decline', { toUserId: userId, callId });
    close('declined', 'declined');
  };
  const hangUp = () => {
    send.current('call:end', { toUserId: userId, callId });
    close(status === 'connected' ? 'ended' : direction === 'outgoing' ? 'missed' : 'declined', 'ended');
  };

  const statusLabel =
    status === 'connected'
      ? fmt(elapsed)
      : status === 'ringing'
        ? direction === 'incoming'
          ? `Incoming ${mode === 'video' ? 'video ' : ''}call…`
          : 'Ringing…'
        : status === 'connecting'
          ? 'Calling…'
          : status === 'declined'
            ? 'Call declined'
            : status === 'unanswered'
              ? 'No answer'
              : 'Call ended';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Avatar uri={avatar || ''} size={112} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
        <View style={styles.mediaHint}>
          <Ionicons name={mode === 'video' ? 'videocam-outline' : 'call-outline'} size={14} color={colors.textMuted} />
          <Text style={styles.mediaHintText}>Live {mode} streaming needs the latest app build</Text>
        </View>
      </View>

      {status === 'connected' ? (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrl, muted && styles.ctrlOn]} onPress={() => setMuted((m) => !m)}>
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrl, styles.hangup]} onPress={hangUp}>
            <Ionicons name="call" size={26} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrl, speaker && styles.ctrlOn]} onPress={() => setSpeaker((v) => !v)}>
            <Ionicons name={speaker ? 'volume-high' : 'volume-low'} size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : direction === 'incoming' && status === 'ringing' ? (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrl, styles.hangup]} onPress={declineIncoming}>
            <Ionicons name="call" size={26} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrl, styles.accept]} onPress={acceptIncoming}>
            <Ionicons name={mode === 'video' ? 'videocam' : 'call'} size={26} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : status === 'connecting' || status === 'ringing' ? (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrl, styles.hangup]} onPress={hangUp}>
            <Ionicons name="call" size={26} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy, justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  name: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: spacing.md },
  status: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  mediaHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, opacity: 0.7 },
  mediaHintText: { fontSize: 11, color: colors.textMuted },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  ctrl: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlOn: { backgroundColor: 'rgba(255,255,255,0.4)' },
  hangup: { backgroundColor: '#E5484D' },
  accept: { backgroundColor: colors.success },
});
