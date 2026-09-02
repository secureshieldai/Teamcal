import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareChannel'>;

export default function ShareChannelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    loadChannel();
  }, []);

  const loadChannel = async () => {
    try {
      const data = await channelsService.getById(channelId);
      setChannel(data);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `https://app.teamcal.com/channels/${channel?.username}`;

  const handleCopyLink = () => {
    Clipboard.setString(shareUrl);
    Alert.alert('Copied', 'Link copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${channel?.name} on TeamCal!\n${shareUrl}`,
        title: channel?.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleInviteViaEmail = () => {
    Alert.alert('Coming Soon', 'Email invites will be available soon');
  };

  const handleInviteViaSMS = () => {
    Alert.alert('Coming Soon', 'SMS invites will be available soon');
  };

  if (loading || !channel) {
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
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Share Channel</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.channelCard}>
          <Avatar uri={channel.avatar} size={56} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.channelName}>{channel.name}</Text>
            <Text style={styles.channelUsername}>@{channel.username}</Text>
            <Text style={styles.channelMeta}>{channel.follower_count} followers</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SHARE VIA</Text>

        <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
          <View style={[styles.shareIcon, { backgroundColor: '#E8F4FF' }]}>
            <Ionicons name="share-social" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>Share Link</Text>
            <Text style={styles.shareDesc}>Share via any app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
          <View style={[styles.shareIcon, { backgroundColor: '#F0E8FF' }]}>
            <Ionicons name="link" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>Copy Link</Text>
            <Text style={styles.shareDesc}>Copy to clipboard</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={handleInviteViaEmail}>
          <View style={[styles.shareIcon, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="mail" size={20} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>Email</Text>
            <Text style={styles.shareDesc}>Send invite via email</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={handleInviteViaSMS}>
          <View style={[styles.shareIcon, { backgroundColor: '#E8FFF0' }]}>
            <Ionicons name="chatbubble" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>SMS</Text>
            <Text style={styles.shareDesc}>Send invite via text</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.linkPreview}>
          <Text style={styles.linkLabel}>Channel Link</Text>
          <Text style={styles.linkUrl}>{shareUrl}</Text>
        </View>
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
  channelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  channelName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  channelUsername: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  channelMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md },
  shareOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  shareIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  shareDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  linkPreview: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg },
  linkLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.xs },
  linkUrl: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
