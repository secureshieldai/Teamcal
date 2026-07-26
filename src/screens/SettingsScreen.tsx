import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MenuListCard from '../components/MenuListCard';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

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
  logoutText: {
    color: colors.macroProtein,
    fontWeight: '700',
    fontSize: 14.5,
  },
});
