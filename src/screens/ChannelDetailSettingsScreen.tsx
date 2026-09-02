import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelDetailSettings'>;

export default function ChannelDetailSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const channel = await channelsService.getById(channelId);
      setAllowComments(channel.allow_comments);
      setAllowReactions(channel.allow_reactions);
      setAllowSharing(channel.allow_sharing);
      setAllowDownloads(channel.allow_downloads);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await channelsService.update(channelId, {
        allow_comments: allowComments,
        allow_reactions: allowReactions,
        allow_sharing: allowSharing,
        allow_downloads: allowDownloads,
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDeleteChannel = () => {
    Alert.alert(
      'Delete Channel',
      'Are you sure? This action cannot be undone and all posts will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await channelsService.deleteChannel(channelId);
              Alert.alert('Deleted', 'Channel has been deleted', [
                { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
              ]);
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Channel Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>INTERACTION SETTINGS</Text>
        
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Comments</Text>
            <Text style={styles.settingDesc}>Let followers comment on posts</Text>
          </View>
          <Switch
            value={allowComments}
            onValueChange={setAllowComments}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Reactions</Text>
            <Text style={styles.settingDesc}>Enable emoji reactions on posts</Text>
          </View>
          <Switch
            value={allowReactions}
            onValueChange={setAllowReactions}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Sharing</Text>
            <Text style={styles.settingDesc}>Let users share posts outside the app</Text>
          </View>
          <Switch
            value={allowSharing}
            onValueChange={setAllowSharing}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Downloads</Text>
            <Text style={styles.settingDesc}>Enable media downloads</Text>
          </View>
          <Switch
            value={allowDownloads}
            onValueChange={setAllowDownloads}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteChannel}>
          <Ionicons name="trash-outline" size={20} color={colors.macroProtein} />
          <Text style={styles.deleteBtnText}>Delete Channel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  settingTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  settingDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingVertical: spacing.md, borderWidth: 1.5, borderColor: colors.macroProtein },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: colors.macroProtein },
});
