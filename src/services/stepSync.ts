import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { trackerService } from './api/tracker.service';

const ENABLED_KEY = 'step_sync_enabled';
const TASK = 'teamcal-step-sync';

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return { start, end: new Date() };
}

async function readHealthKit(requestPermission: boolean) {
  const health = require('@kingstinct/react-native-healthkit') as typeof import('@kingstinct/react-native-healthkit');
  if (!(await health.isHealthDataAvailableAsync())) throw new Error('Apple Health is unavailable on this device.');
  if (requestPermission) await health.requestAuthorization({ toRead: ['HKQuantityTypeIdentifierStepCount'] });
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
  if (!permission.granted) await Pedometer.requestPermissionsAsync();
  if (Platform.OS !== 'ios') throw new Error('Android historical steps require Health Connect.');
  const { start, end } = todayRange();
  return (await Pedometer.getStepCountAsync(start, end)).steps;
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

export async function enableStepSync() {
  const result = await syncSteps(true);
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  await registerStepBackgroundSync();
  return result;
}

export async function disableStepSync() {
  await AsyncStorage.removeItem(ENABLED_KEY);
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
    await syncSteps(false);
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
    const result = await syncSteps(false);
    baseSteps = result.steps;
    await startLivePedometer();
  };
  const subscription = AppState.addEventListener('change', state => {
    if (state === 'active') refresh().catch(() => {});
    else pedometerSubscription?.remove();
  });
  refresh().catch(() => {});
  return () => { subscription.remove(); pedometerSubscription?.remove(); };
}
