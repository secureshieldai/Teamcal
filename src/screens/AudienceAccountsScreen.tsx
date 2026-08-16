import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { personalService, type PersonalRecord } from '../services/api/personal.service';
import { apiClient } from '../services/api/client';
import { colors, radii, shadow, spacing, typography } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectedAccount = {
  platform: string;
  accountId: string;
  displayName: string;
  username: string;
  avatar?: string;
  status: 'connected' | 'expired' | 'error';
  accessToken?: string;
  refreshToken?: string;
  connectedAt: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'AudienceAccounts'>;

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { key: 'instagram',  label: 'Instagram',  color: '#E1306C', icon: 'logo-instagram',  authType: 'oauth' },
  { key: 'facebook',   label: 'Facebook',   color: '#1877F2', icon: 'logo-facebook',   authType: 'oauth' },
  { key: 'linkedin',   label: 'LinkedIn',   color: '#0A66C2', icon: 'logo-linkedin',   authType: 'oauth' },
  { key: 'x',          label: 'X (Twitter)',color: '#000000', icon: 'logo-twitter',    authType: 'oauth' },
  { key: 'reddit',     label: 'Reddit',     color: '#FF4500', icon: 'logo-reddit',     authType: 'oauth' },
  { key: 'quora',      label: 'Quora',      color: '#B92B27', icon: 'help-circle',     authType: 'oauth' },
  { key: 'discord',    label: 'Discord',    color: '#5865F2', icon: 'logo-discord',    authType: 'oauth' },
  { key: 'tiktok',     label: 'TikTok',     color: '#010101', icon: 'musical-notes',   authType: 'oauth' },
  { key: 'whatsapp',   label: 'WhatsApp',   color: '#25D366', icon: 'logo-whatsapp',   authType: 'business' },
  { key: 'telegram',   label: 'Telegram',   color: '#2AABEE', icon: 'paper-plane',     authType: 'bot' },
] as const;

type PlatformKey = typeof PLATFORMS[number]['key'];

function getPlatform(key: string) {
  return PLATFORMS.find(p => p.key === key) ?? PLATFORMS[0];
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'https://teamcal-mr7g.onrender.com/api').replace(/\/api$/, '');

async function startOAuthFlow(platformKey: PlatformKey): Promise<void> {
  // Initiate server-side OAuth — backend redirects to platform, then back to app via deep link
  const url = `${BASE_URL}/api/social-auth/connect/${platformKey}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Unable to open browser', 'Please update your device settings to allow opening links.');
    return;
  }
  await Linking.openURL(url);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AudienceAccountsScreen({ navigation }: Props) {
  const [accounts, setAccounts] = useState<PersonalRecord<ConnectedAccount>[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Modals
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [optionsAccount, setOptionsAccount] = useState<PersonalRecord<ConnectedAccount> | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await personalService.list<ConnectedAccount>('audience-account');
      setAccounts(rows);
    } catch (e) {
      // silently ignore on background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Listen for deep-link callback after OAuth
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('social-auth/callback') || url.includes('audience-accounts')) {
        setConnecting(null);
        load();
      }
    });
    return () => sub.remove();
  }, [load]));

  // Group accounts by platform
  const grouped = PLATFORMS.map(p => ({
    platform: p,
    items: accounts.filter(a => a.data.platform === p.key),
  }));

  const connectedPlatforms = grouped.filter(g => g.items.length > 0);
  const hasAny = connectedPlatforms.length > 0;

  const handleConnect = async (platformKey: PlatformKey) => {
    setShowPlatformPicker(false);
    setConnecting(platformKey);
    try {
      await startOAuthFlow(platformKey);
    } catch (e) {
      Alert.alert('Connection failed', (e as Error).message);
    } finally {
      // connecting state cleared when deep link returns or after timeout
      setTimeout(() => setConnecting(null), 30_000);
    }
  };

  const handleDisconnect = async (record: PersonalRecord<ConnectedAccount>) => {
    setOptionsAccount(null);
    Alert.alert(
      `Remove ${record.data.displayName}?`,
      'All scheduled posts for this account will be cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await personalService.remove(record.id);
              await load();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  };

  const handleReconnect = async (record: PersonalRecord<ConnectedAccount>) => {
    setOptionsAccount(null);
    setConnecting(record.data.platform);
    try {
      await startOAuthFlow(record.data.platform as PlatformKey);
    } catch (e) {
      Alert.alert('Reconnect failed', (e as Error).message);
    } finally {
      setTimeout(() => setConnecting(null), 30_000);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Social Accounts</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Connect New Account */}
        <Text style={s.sectionLabel}>Connect New Account</Text>
        <Text style={s.sectionSub}>Connect your social accounts to create and schedule posts.</Text>
        <TouchableOpacity style={s.connectBtn} onPress={() => setShowPlatformPicker(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={s.connectBtnText}>Connect New Account</Text>
        </TouchableOpacity>

        {/* Connected Accounts */}
        <Text style={[s.sectionLabel, { marginTop: spacing.xl }]}>Connected Accounts</Text>

        {!hasAny && !loading && (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No connected accounts yet</Text>
            <Text style={s.emptySub}>Connect your first social account to get started.</Text>
          </View>
        )}

        {connectedPlatforms.map(({ platform, items }) => (
          <View key={platform.key} style={[s.platformGroup, shadow.soft]}>
            <TouchableOpacity
              style={s.platformGroupHeader}
              onPress={() => setExpandedPlatform(expandedPlatform === platform.key ? null : platform.key)}
              activeOpacity={0.7}
            >
              <View style={[s.platformIcon, { backgroundColor: platform.color }]}>
                <Ionicons name={platform.icon as any} size={18} color="#fff" />
              </View>
              <Text style={s.platformName}>{platform.label}</Text>
              <View style={s.platformBadge}>
                <Text style={s.platformBadgeText}>{items.length}</Text>
              </View>
              <Ionicons
                name={expandedPlatform === platform.key ? 'chevron-up' : 'chevron-forward'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {(expandedPlatform === platform.key || items.length <= 2) &&
              items.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onOptions={() => setOptionsAccount(account)}
                />
              ))}

            <TouchableOpacity
              style={s.connectAnotherBtn}
              onPress={() => handleConnect(platform.key as PlatformKey)}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={s.connectAnotherText}>Connect another {platform.label}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Unconnected platforms as simple rows */}
        {grouped.filter(g => g.items.length === 0).map(({ platform }) => (
          <TouchableOpacity
            key={platform.key}
            style={[s.unconnectedRow, shadow.soft]}
            onPress={() => handleConnect(platform.key as PlatformKey)}
            activeOpacity={0.7}
          >
            <View style={[s.platformIcon, { backgroundColor: platform.color }]}>
              <Ionicons name={platform.icon as any} size={18} color="#fff" />
            </View>
            <Text style={s.platformName}>{platform.label}</Text>
            <Text style={s.connectLabel}>Connect</Text>
            {connecting === platform.key && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.sm }} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Platform Picker Modal */}
      <Modal visible={showPlatformPicker} animationType="slide" transparent>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowPlatformPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalSheet} onPress={() => {}}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Choose a platform to connect</Text>
            <Text style={s.modalSub}>We'll never post without your permission.</Text>
            <View style={s.platformGrid}>
              {PLATFORMS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={s.platformGridItem}
                  onPress={() => handleConnect(p.key as PlatformKey)}
                  activeOpacity={0.75}
                >
                  <View style={[s.platformGridIcon, { backgroundColor: p.color }]}>
                    <Ionicons name={p.icon as any} size={22} color="#fff" />
                  </View>
                  <Text style={s.platformGridLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Account Options Bottom Sheet */}
      <Modal visible={!!optionsAccount} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            {optionsAccount && (
              <>
                <View style={s.optionsAccountHeader}>
                  {optionsAccount.data.avatar ? (
                    <Image source={{ uri: optionsAccount.data.avatar }} style={s.optionsAvatar} />
                  ) : (
                    <View style={[s.optionsAvatarPlaceholder, { backgroundColor: getPlatform(optionsAccount.data.platform).color }]}>
                      <Ionicons name={getPlatform(optionsAccount.data.platform).icon as any} size={20} color="#fff" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.optionsName}>{optionsAccount.data.displayName}</Text>
                    <Text style={s.optionsUsername}>@{optionsAccount.data.username}</Text>
                  </View>
                </View>

                <TouchableOpacity style={s.optionRow} onPress={() => setOptionsAccount(null)}>
                  <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
                  <Text style={s.optionRowText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.optionRow} onPress={() => handleReconnect(optionsAccount)}>
                  <Ionicons name="refresh-outline" size={20} color={colors.textPrimary} />
                  <Text style={s.optionRowText}>Reconnect Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.optionRow, s.optionRowDanger]} onPress={() => handleDisconnect(optionsAccount)}>
                  <Ionicons name="trash-outline" size={20} color={colors.macroProtein} />
                  <Text style={[s.optionRowText, { color: colors.macroProtein }]}>Remove Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelBtn} onPress={() => setOptionsAccount(null)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Account Row ──────────────────────────────────────────────────────────────

function AccountRow({
  account,
  onOptions,
}: {
  account: PersonalRecord<ConnectedAccount>;
  onOptions: () => void;
}) {
  const p = getPlatform(account.data.platform);
  const isExpired = account.data.status === 'expired' || account.data.status === 'error';

  return (
    <View style={s.accountRow}>
      {account.data.avatar ? (
        <Image source={{ uri: account.data.avatar }} style={s.avatar} />
      ) : (
        <View style={[s.avatarPlaceholder, { backgroundColor: p.color }]}>
          <Ionicons name={p.icon as any} size={16} color="#fff" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.accountName}>{account.data.displayName}</Text>
        <Text style={s.accountUsername}>
          {account.data.username ? `@${account.data.username}` : account.data.accountId}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[s.statusDot, isExpired ? s.statusDotError : s.statusDotOk]}>
          <Text style={[s.statusDotText, { color: isExpired ? colors.macroProtein : colors.success }]}>
            {isExpired ? 'Expired' : 'Connected'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onOptions} style={s.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },

  content: { padding: spacing.lg, paddingBottom: 40 },

  sectionLabel: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },

  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  connectBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  // Platform group (connected)
  platformGroup: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  platformGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  platformIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  platformName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  platformBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  platformBadgeText: { fontSize: 11, fontWeight: '800', color: colors.white },

  // Account row inside group
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  accountName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  accountUsername: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  statusDot: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.pill },
  statusDotOk: { backgroundColor: '#E6F9F0' },
  statusDotError: { backgroundColor: '#FFF0F0' },
  statusDotText: { fontSize: 10, fontWeight: '700' },
  moreBtn: { padding: spacing.xs },

  connectAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  connectAnotherText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  // Unconnected platform rows
  unconnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  connectLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xs },
  modalSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },

  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  platformGridItem: { width: 80, alignItems: 'center', gap: spacing.xs },
  platformGridIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  platformGridLabel: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },

  cancelBtn: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },

  // Options sheet
  optionsAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionsAvatar: { width: 48, height: 48, borderRadius: 24 },
  optionsAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  optionsName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionsUsername: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowDanger: { borderBottomWidth: 0 },
  optionRowText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
