import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, type Socket } from 'socket.io-client';
import type { EarnAsset } from './api/earn.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://teamcal-mr7g.onrender.com/api';
const REALTIME_URL = API_URL.replace(/\/api\/?$/, '');

export type AssetChange = {
  action: 'created' | 'updated' | 'deleted';
  asset: EarnAsset | { id: string; kind?: string };
};

export async function subscribeToAssetChanges(onChange: (change: AssetChange) => void) {
  const token = await AsyncStorage.getItem('auth_token');
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
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) return () => undefined;
  const socket: Socket = io(REALTIME_URL, { path: '/realtime', transports: ['websocket'], auth: { token }, reconnection: true });
  const listener = (event: { storeId: string }) => { if (event.storeId === storeId) onChange(); };
  socket.on('store:commerce', listener);
  return () => { socket.off('store:commerce', listener); socket.disconnect(); };
}
