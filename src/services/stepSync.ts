import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { trackerService } from './api/tracker.service';

const ENABLED_KEY = 'step_sync_enabled';
const CONNECTIONS_KEY = 'step_source_connections';
const TASK = 'teamcal-step-sync';

export type StepSourceId = 'phone-motion' | 'apple-health' | 'health-connect';
export type StepSourceConnection = { connected: boolean; lastSyncedAt?: number; error?: string };
export type StepConnections = Partial<Record<StepSourceId, StepSourceConnection>>;

export async function getStepConnections(): Promise<StepConnections> {
  const raw = await AsyncStorage.getItem(CONNECTIONS_KEY);
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
async function setConnection(source: StepSourceId, value?: StepSourceConnection) {
  const all = await getStepConnections();
  if (value) all[source] = value; else delete all[source];
  await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(all));
}

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return { start, end: new Date() };
}

async function readHealthKit(requestPermission: boolean) {
  const health = require('@kingstinct/react-native-healthkit') as typeof import('@kingstinct/react-native-healthkit');
  if (!(await health.isHealthDataAvailableAsync())) throw new Error('Apple Health is unavailable on this device.');
  if (requestPermission) await health.requestAuthorization({ toRead: [
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierDistanceWalkingRunning',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKQuantityTypeIdentifierAppleExerciseTime',
  ] });
  const { start, end } = todayRange();
  const result = await health.queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierStepCount', ['cumulativeSum'],
    { filter: { date: { startDate: start, endDate: end } }, unit: 'count' }
  );
  return Number(result.sumQuantity?.quantity ?? 0);
}

async function readHealthConnect(requestPermission: boolean) {
  const health = require('react-native-health-connect') as typeof import('react-native-health-connect');
  if (!(await health.initialize())) throw new Error('Health Connect is unavailable.');
  if (requestPermission) {
    await health.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'BackgroundAccessPermission' },
    ]);
  }
  const { start, end } = todayRange();
  const result = await health.aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
  });
  return Number(result.COUNT_TOTAL ?? 0);
}

async function readPedometer() {
  const available = await Pedometer.isAvailableAsync();
  if (!available) throw new Error('This device has no supported pedometer.');
  const permission = await Pedometer.getPermissionsAsync();
  const granted = permission.granted ? permission : await Pedometer.requestPermissionsAsync();
  if (!granted.granted) throw new Error('Physical activity permission was not granted. Enable it in device settings and try again.');
  if (Platform.OS !== 'ios') return 0;
  const { start, end } = todayRange();
  return (await Pedometer.getStepCountAsync(start, end)).steps;
}

export async function syncStepSource(source: StepSourceId, requestPermission = false) {
  if (Platform.OS === 'web') throw new Error('Step sources are available in the iOS and Android apps.');
  let steps = 0;
  if (source === 'phone-motion') steps = await readPedometer();
  else if (source === 'apple-health') {
    if (Platform.OS !== 'ios') throw new Error('Apple Watch is available on iOS only.');
    steps = await readHealthKit(requestPermission);
  } else {
    if (Platform.OS !== 'android') throw new Error('Health Connect is available on Android only.');
    steps = await readHealthConnect(requestPermission);
  }
  const syncedAt = Date.now();
  await trackerService.syncDailySteps(steps, source);
  await setConnection(source, { connected: true, lastSyncedAt: syncedAt });
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  await registerStepBackgroundSync();
  return { steps, source, syncedAt };
}

export async function connectStepSource(source: StepSourceId) {
  try { return await syncStepSource(source, true); }
  catch (error) { await setConnection(source, { connected: false, error: (error as Error).message }); throw error; }
}

export async function disconnectStepSource(source: StepSourceId) {
  await setConnection(source);
  if (!Object.values(await getStepConnections()).some((item) => item?.connected)) await disableStepSync();
}

export async function openStepSourcePermissions(source: StepSourceId) {
  if (source === 'health-connect' && Platform.OS === 'android') {
    const health = require('react-native-health-connect') as typeof import('react-native-health-connect');
    health.openHealthConnectSettings();
    return;
  }
  const { Linking } = require('react-native') as typeof import('react-native');
  await Linking.openSettings();
}

export async function syncSteps(requestPermission = false) {
  if (Platform.OS === 'web') throw new Error('Automatic step sync is available on iOS and Android only.');
  let steps: number; let source: string;
  try {
    if (Platform.OS === 'ios') { steps = await readHealthKit(requestPermission); source = 'apple-health'; }
    else { steps = await readHealthConnect(requestPermission); source = 'health-connect'; }
  } catch (healthError) {
    if (!requestPermission) throw healthError;
    steps = await readPedometer(); source = 'device-pedometer';
  }
  await trackerService.syncDailySteps(steps, 'automatic-health');
  return { steps, source, syncedAt: Date.now() };
}

export async function syncConnectedStepSources() {
  const connections = await getStepConnections();
  const connected = (Object.keys(connections) as StepSourceId[]).filter((key) => connections[key]?.connected);
  if (!connected.length) throw new Error('No step source is connected.');
  return Promise.all(connected.map((source) => syncStepSource(source, false)));
}

export async function enableStepSync() {
  const result = await syncSteps(true);
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  await registerStepBackgroundSync();
  return result;
}

export async function disableStepSync() {
  await AsyncStorage.removeItem(ENABLED_KEY);
  await AsyncStorage.removeItem(CONNECTIONS_KEY);
  if (await TaskManager.isTaskRegisteredAsync(TASK)) await BackgroundTask.unregisterTaskAsync(TASK);
}

export async function isStepSyncEnabled() { return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true'; }

export async function registerStepBackgroundSync() {
  if (Platform.OS === 'web' || !(await isStepSyncEnabled())) return;
  if (!(await TaskManager.isTaskRegisteredAsync(TASK))) {
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
  }
}

TaskManager.defineTask(TASK, async () => {
  try {
    if (!(await isStepSyncEnabled())) return BackgroundTask.BackgroundTaskResult.Success;
    await syncConnectedStepSources();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export function startForegroundStepSync() {
  registerStepBackgroundSync().catch(() => {});
  let pedometerSubscription: { remove(): void } | undefined;
  let baseSteps = 0;
  const startLivePedometer = async () => {
    if (!(await Pedometer.isAvailableAsync())) return;
    const permission = await Pedometer.getPermissionsAsync();
    if (!permission.granted) return;
    pedometerSubscription?.remove();
    pedometerSubscription = Pedometer.watchStepCount(({ steps }) => {
      trackerService.syncDailySteps(baseSteps + steps, 'automatic-health').catch(() => {});
    });
  };
  const refresh = async () => {
    if (!(await isStepSyncEnabled())) return;
    const results = await syncConnectedStepSources();
    baseSteps = results.find((item) => item.source === 'phone-motion')?.steps ?? 0;
    await startLivePedometer();
  };
  const subscription = AppState.addEventListener('change', state => {
    if (state === 'active') refresh().catch(() => {});
    else pedometerSubscription?.remove();
  });
  refresh().catch(() => {});
  return () => { subscription.remove(); pedometerSubscription?.remove(); };
}
