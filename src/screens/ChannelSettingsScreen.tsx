import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelSettings'>;

export default function ChannelSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const settingsOptions = [
    { icon: 'create-outline', label: 'Edit Channel', action: () => Alert.alert('Edit', 'Edit channel feature') },
    { icon: 'people-outline', label: 'Manage Admins', action: () => Alert.alert('Admins', 'Admin management') },
    { icon: 'settings-outline', label: 'Channel Settings', action: () => Alert.alert('Settings', 'Settings panel') },
    { icon: 'analytics-outline', label: 'View Analytics', action: () => navigation.navigate('ChannelAnalytics', { channelId }) },
    { icon: 'share-social-outline', label: 'Share Channel', action: () => Alert.alert('Share', 'Share options') },
    { icon: 'flag-outline', label: 'Report Channel', action: () => Alert.alert('Report', 'Report form'), danger: true },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Channel Options</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionRow}
            onPress={option.action}
            activeOpacity={0.7}
          >
            <Ionicons name={option.icon as any} size={20} color={option.danger ? colors.macroProtein : colors.textPrimary} />
            <Text style={[styles.optionText, option.danger && { color: colors.macroProtein }]}>{option.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
});
