import { storage } from './auth/secureStorage';
import { io, type Socket } from 'socket.io-client';
import type { EarnAsset } from './api/earn.service';
import type { DirectMessage } from './api/social.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://teamcal-mr7g.onrender.com/api';
const REALTIME_URL = API_URL.replace(/\/api\/?$/, '');

export type AssetChange = {
  action: 'created' | 'updated' | 'deleted';
  asset: EarnAsset | { id: string; kind?: string };
};

export async function subscribeToAssetChanges(onChange: (change: AssetChange) => void) {
  const token = await storage.getToken();
  if (!token) return () => undefined;

  const socket: Socket = io(REALTIME_URL, {
    path: '/realtime',
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
  });
  socket.on('earn:asset', onChange);

  return () => {
    socket.off('earn:asset', onChange);
    socket.disconnect();
  };
}

export async function subscribeToStoreCommerce(storeId: string, onChange: () => void) {
  const token = await storage.getToken();
  if (!token) return () => undefined;
  const socket: Socket = io(REALTIME_URL, { path: '/realtime', transports: ['websocket'], auth: { token }, reconnection: true });
  const listener = (event: { storeId: string }) => { if (event.storeId === storeId) onChange(); };
  socket.on('store:commerce', listener);
  return () => { socket.off('store:commerce', listener); socket.disconnect(); };
}

// ── Direct messaging + call signaling ──────────────────────────────
// One shared, ref-counted socket for everything DM-related so the inbox
// badge, an open thread, and the incoming-call listener share a connection.
let dmSocket: Socket | null = null;
let dmRefs = 0;

async function acquireDmSocket(): Promise<Socket | null> {
  const token = await storage.getToken();
  if (!token) return null;
  if (!dmSocket) {
    dmSocket = io(REALTIME_URL, { path: '/realtime', transports: ['websocket'], auth: { token }, reconnection: true });
  }
  dmRefs += 1;
  return dmSocket;
}

function releaseDmSocket() {
  dmRefs = Math.max(0, dmRefs - 1);
  if (dmRefs === 0 && dmSocket) {
    dmSocket.disconnect();
    dmSocket = null;
  }
}

export type DmMessageEvent = { conversationId: string; message: DirectMessage };
export type DmReadEvent = { conversationId: string; readerId: string };
export type DmTypingEvent = { fromUserId: string; typing: boolean };

export type InboxHandlers = {
  onMessage?: (e: DmMessageEvent) => void;
  onRead?: (e: DmReadEvent) => void;
  onRequestAccepted?: (e: { conversationId: string; byId: string }) => void;
};

/** Inbox-wide listener — drives the unread badge and conversation list. */
export async function subscribeToInbox(handlers: InboxHandlers) {
  const socket = await acquireDmSocket();
  if (!socket) return () => undefined;
  const onMessage = (e: DmMessageEvent) => handlers.onMessage?.(e);
  const onRead = (e: DmReadEvent) => handlers.onRead?.(e);
  const onAccepted = (e: { conversationId: string; byId: string }) => handlers.onRequestAccepted?.(e);
  socket.on('dm:message', onMessage);
  socket.on('dm:read', onRead);
  socket.on('dm:request_accepted', onAccepted);
  return () => {
    socket.off('dm:message', onMessage);
    socket.off('dm:read', onRead);
    socket.off('dm:request_accepted', onAccepted);
    releaseDmSocket();
  };
}

export type ConversationHandlers = {
  peerId: string;
  onMessage?: (m: DirectMessage) => void;
  onRead?: () => void;
  onTyping?: (typing: boolean) => void;
};

/** Listener scoped to one open thread. Returns an unsubscribe + a setTyping fn. */
export async function subscribeToConversation(h: ConversationHandlers) {
  const socket = await acquireDmSocket();
  if (!socket) return { unsubscribe: () => undefined, setTyping: (_t: boolean) => undefined };
  const onMessage = (e: DmMessageEvent) => {
    if (e.message.senderId === h.peerId || e.message.mine) h.onMessage?.(e.message);
  };
  const onRead = (e: DmReadEvent) => { if (e.readerId === h.peerId) h.onRead?.(); };
  const onTyping = (e: DmTypingEvent) => { if (e.fromUserId === h.peerId) h.onTyping?.(e.typing); };
  socket.on('dm:message', onMessage);
  socket.on('dm:read', onRead);
  socket.on('dm:typing', onTyping);
  return {
    unsubscribe: () => {
      socket.off('dm:message', onMessage);
      socket.off('dm:read', onRead);
      socket.off('dm:typing', onTyping);
      releaseDmSocket();
    },
    setTyping: (typing: boolean) => socket.emit('dm:typing', { toUserId: h.peerId, typing }),
  };
}

export type CallSignal =
  | { event: 'call:invite'; fromUserId: string; callId: string; mode: 'audio' | 'video'; name?: string; avatar?: string | null }
  | { event: 'call:accept'; fromUserId: string; callId: string }
  | { event: 'call:decline'; fromUserId: string; callId: string }
  | { event: 'call:end'; fromUserId: string; callId: string; durationS?: number }
  | { event: 'call:sdp'; fromUserId: string; callId: string; sdp: unknown }
  | { event: 'call:ice'; fromUserId: string; callId: string; candidate: unknown };

const CALL_EVENTS = ['call:invite', 'call:accept', 'call:decline', 'call:end', 'call:sdp', 'call:ice'] as const;

/** Subscribe to every call-signaling event (used by the global incoming-call listener and CallScreen). */
export async function subscribeToCallSignals(onSignal: (s: CallSignal) => void) {
  const socket = await acquireDmSocket();
  if (!socket) return { unsubscribe: () => undefined, send: (_e: string, _p: Record<string, unknown>) => undefined };
  const handlers = CALL_EVENTS.map((event) => {
    const fn = (payload: Record<string, unknown>) => onSignal({ event, ...(payload as object) } as CallSignal);
    socket.on(event, fn);
    return [event, fn] as const;
  });
  return {
    unsubscribe: () => {
      handlers.forEach(([event, fn]) => socket.off(event, fn));
      releaseDmSocket();
    },
    send: (event: string, payload: Record<string, unknown>) => socket.emit(event, payload),
  };
}
