import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, typography } from '../theme';

type TabKey = 'home' | 'explore' | 'community' | 'profile';

type Props = {
  activeTab: TabKey;
  onChangeTab?: (tab: TabKey) => void;
  onPressAdd?: () => void;
};

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'explore', label: 'Explore', icon: 'search-outline', activeIcon: 'search' },
  { key: 'community', label: 'Community', icon: 'people-outline', activeIcon: 'people' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabBar({ activeTab, onChangeTab, onPressAdd }: Props) {
  const insets = useSafeAreaInsets();
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  const renderTab = (tab: (typeof TABS)[number]) => {
    const isActive = activeTab === tab.key;
    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tab}
        onPress={() => onChangeTab?.(tab.key)}
        activeOpacity={0.7}
      >
        <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? colors.primary : colors.textMuted} />
        <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }, shadow.card]}>
      {leftTabs.map(renderTab)}

      <TouchableOpacity style={styles.addButton} onPress={onPressAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {rightTabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    ...typography.small,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
    borderWidth: 4,
    borderColor: colors.background,
  },
});
