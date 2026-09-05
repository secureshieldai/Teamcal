import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import type { Channel } from '../types/channels';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelAbout'>;

type InfoSection = {
  icon: string;
  label: string;
  value: string | number;
};

export default function ChannelAboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannel();
  }, [channelId]);

  const loadChannel = async () => {
    try {
      const data = await channelsService.getById(channelId);
      setChannel(data);
    } catch (error) {
      console.error('[ChannelAbout] Error loading channel:', error);
    } finally {
      setLoading(false);
    }
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

  if (!channel) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Channel not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const infoSections: InfoSection[] = [
    { icon: 'people-outline', label: 'Followers', value: channel.follower_count?.toLocaleString() || '0' },
    { icon: 'document-text-outline', label: 'Posts', value: channel.post_count || 0 },
    { icon: 'calendar-outline', label: 'Created', value: new Date(channel.created_at).toLocaleDateString() },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Channel Info</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar uri={channel.avatar || ''} size={80} />
          <Text style={styles.channelName}>{channel.name}</Text>
          <Text style={styles.username}>@{channel.username}</Text>
          {channel.description && <Text style={styles.description}>{channel.description}</Text>}
        </View>

        <View style={styles.statsRow}>
          {infoSections.map((section, index) => (
            <View key={index} style={styles.stat}>
              <Ionicons name={section.icon as any} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{section.value}</Text>
              <Text style={styles.statLabel}>{section.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Link</Text>
          <TouchableOpacity style={styles.linkRow}>
            <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>teamcal.app/c/{channel.username}</Text>
            <Ionicons name="copy-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {channel.website_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            <TouchableOpacity style={styles.socialRow}>
              <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.socialText}>{channel.website_url}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Files</Text>
          <TouchableOpacity style={styles.fileRow}>
            <Ionicons name="folder-outline" size={20} color={colors.primary} />
            <Text style={styles.fileText}>Channel Files (12)</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <TouchableOpacity style={styles.memberRow}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberText}>Admins & Moderators</Text>
              <Text style={styles.memberSubtext}>5 members</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.reportBtn}>
          <Ionicons name="flag-outline" size={18} color="#DC2626" />
          <Text style={styles.reportText}>Report Channel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveBtn}>
          <Ionicons name="exit-outline" size={18} color="#DC2626" />
          <Text style={styles.leaveText}>Leave Channel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: colors.textMuted },
  profileSection: { alignItems: 'center', paddingVertical: spacing.xl },
  channelName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md },
  username: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.md, textTransform: 'uppercase' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  linkText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  socialText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  fileText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  memberText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  memberSubtext: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reportText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  leaveText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});
