import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MenuListCard from '../components/MenuListCard';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { disableStepSync, enableStepSync, isStepSyncEnabled, syncSteps } from '../services/stepSync';

const accountItems = [
  { id: 'edit-profile', icon: 'person-outline' as const, label: 'Edit Profile' },
  { id: 'change-password', icon: 'lock-closed-outline' as const, label: 'Change Password' },
  { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications' },
  { id: 'privacy', icon: 'shield-checkmark-outline' as const, label: 'Privacy' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [stepEnabled, setStepEnabled] = useState(false);
  const [stepBusy, setStepBusy] = useState(false);
  useEffect(() => { isStepSyncEnabled().then(setStepEnabled); }, []);
  const routes: Record<string, keyof RootStackParamList> = {
    'edit-profile': 'EditProfile',
    'change-password': 'ChangePassword',
    notifications: 'NotificationSettings',
    privacy: 'Privacy',
    help: 'HelpSupport',
  };

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const toggleSteps = async () => {
    try {
      setStepBusy(true);
      if (stepEnabled) {
        await disableStepSync(); setStepEnabled(false);
      } else {
        const result = await enableStepSync(); setStepEnabled(true);
        Alert.alert('Steps connected', `${result.steps.toLocaleString()} steps synced from ${result.source}.`);
      }
    } catch (error) { Alert.alert('Could not connect steps', (error as Error).message); }
    finally { setStepBusy(false); }
  };

  const syncNow = async () => {
    try { setStepBusy(true); const result = await syncSteps(false); Alert.alert('Steps synced', `${result.steps.toLocaleString()} steps from ${result.source}.`); }
    catch (error) { Alert.alert('Sync failed', (error as Error).message); }
    finally { setStepBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MenuListCard items={accountItems} onPressItem={(id) => navigation.navigate(routes[id] as never)} />

        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Ionicons name="walk-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.healthTitle}>{Platform.OS === 'ios' ? 'Apple Health steps' : Platform.OS === 'android' ? 'Health Connect steps' : 'Automatic steps'}</Text>
              <Text style={styles.healthText}>{stepEnabled ? 'Connected · syncs when the app opens and periodically in the background.' : 'Connect your phone or wearable step total.'}</Text>
            </View>
          </View>
          <View style={styles.healthActions}>
            {stepEnabled && <TouchableOpacity onPress={syncNow} disabled={stepBusy}><Text style={styles.syncText}>Sync now</Text></TouchableOpacity>}
            <TouchableOpacity style={[styles.connectButton, stepEnabled && styles.disconnectButton]} onPress={toggleSteps} disabled={stepBusy || Platform.OS === 'web'}>
              <Text style={styles.connectText}>{stepBusy ? 'Please wait…' : stepEnabled ? 'Disconnect' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogOut}
          activeOpacity={0.8}
          disabled={loggingOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.macroProtein} />
          <Text style={styles.logoutText}>{loggingOut ? 'Logging Out…' : 'Log Out'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.macroProtein,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  healthCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  healthHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  healthTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  healthText: { ...typography.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  healthActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md },
  connectButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  disconnectButton: { backgroundColor: colors.textSecondary },
  connectText: { color: colors.white, fontWeight: '700' },
  syncText: { color: colors.primary, fontWeight: '700' },
  logoutText: {
    color: colors.macroProtein,
    fontWeight: '700',
    fontSize: 14.5,
  },
});
