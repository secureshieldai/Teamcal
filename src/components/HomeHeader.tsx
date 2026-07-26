import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, spacing, typography } from '../theme';

type Props = {
  avatarUri: string;
  hasNotification?: boolean;
  onPressNotifications?: () => void;
  onPressAvatar?: () => void;
};

export default function HomeHeader({ avatarUri, hasNotification = true, onPressNotifications, onPressAvatar }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TeamCal</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={onPressNotifications}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {hasNotification && <View style={styles.badgeDot} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressAvatar} accessibilityLabel="Your profile">
          <Avatar uri={avatarUri} size={38} online />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  logo: {
    ...typography.h1,
    color: colors.navy,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
});
