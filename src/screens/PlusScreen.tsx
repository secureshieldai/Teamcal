import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LogOptionsGrid from '../components/LogOptionsGrid';
import FriendActivityRow from '../components/FriendActivityRow';
import MenuListCard from '../components/MenuListCard';
import SectionHeader from '../components/SectionHeader';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { logOptions, topFriends, moreLoggingOptions } from '../data/plusData';
import type { NoParamRoute, RootStackParamList } from '../navigation/types';

const LOG_DESTINATIONS: Record<string, NoParamRoute> = {};

const LOG_KINDS: Record<string, string> = {
  'log-water': 'water', workout: 'workout', weight: 'weight', steps: 'steps',
  fasting: 'fasting', sleep: 'sleep', 'body-stats': 'body-stats',
  'log-meal': 'meal', 'log-supplement': 'supplement', 'log-body': 'body-stats',
  'log-mood': 'mood', 'add-note': 'note',
};

export default function PlusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What would you like to log?</Text>
        <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LogOptionsGrid
          items={logOptions}
          onPressItem={(id) => {
            if (id === 'scan-meal') { navigation.navigate('ScanFood', { mode: 'food' }); return; }
            if (LOG_KINDS[id]) {
              navigation.navigate('QuickLogEntry', { kind: LOG_KINDS[id] });
              return;
            }
            const destination = LOG_DESTINATIONS[id];
            if (destination) navigation.navigate(destination as never);
          }}
        />

        <SectionHeader title="Friends (Top 5)" style={styles.sectionSpacing} />
        <View style={[styles.card, shadow.card]}>
          {topFriends.map((friend) => (
            <FriendActivityRow key={friend.id} {...friend} />
          ))}
        </View>

        <SectionHeader title="More Logging Options" style={styles.sectionSpacing} />
        <MenuListCard items={moreLoggingOptions} onPressItem={(id) => navigation.navigate('QuickLogEntry', { kind: LOG_KINDS[id] })} />

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.closeButtonText}>Close</Text>
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
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  closeButtonText: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 14,
  },
});
