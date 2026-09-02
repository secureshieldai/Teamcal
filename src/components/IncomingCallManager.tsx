import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCallSignals } from '../services/realtime';
import { navigationRef } from '../navigation/navigationRef';

/**
 * App-root listener for inbound call invites. Renders nothing; when a `call:invite`
 * arrives it pushes the full-screen CallScreen in "incoming" mode. CallScreen owns
 * the rest of the signaling handshake.
 */
export default function IncomingCallManager() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cleanup = () => undefined as void;
    subscribeToCallSignals((signal) => {
      if (signal.event !== 'call:invite') return;
      if (!navigationRef.isReady()) return;
      const current = navigationRef.getCurrentRoute()?.name;
      if (current === 'Call') return; // already handling a call
      navigationRef.navigate('Call', {
        userId: signal.fromUserId,
        name: signal.name || 'Incoming call',
        avatar: signal.avatar ?? null,
        mode: signal.mode,
        direction: 'incoming',
        callId: signal.callId,
      });
    }).then((s) => {
      cleanup = s.unsubscribe;
    });
    return () => cleanup();
  }, [isAuthenticated]);

  return null;
}
