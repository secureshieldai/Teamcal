import React, { useState } from 'react';
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
  const [isPublic, setIsPublic] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [nonAdminPosts, setNonAdminPosts] = useState(false);
  const [allowSharing, setAllowSharing] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(false);

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
        {/* Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setIsPublic(true)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {isPublic && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Public channel</Text>
              <Text style={styles.radioDesc}>Anyone can find and follow</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setIsPublic(false)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {!isPublic && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Private channel</Text>
              <Text style={styles.radioDesc}>Require approval to join</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Member Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member permissions</Text>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow reactions</Text>
            <TouchableOpacity 
              style={[styles.switch, allowReactions && styles.switchActive]}
              onPress={() => setAllowReactions(!allowReactions)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowReactions && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionLabel}>Non-admin posts</Text>
              <Text style={styles.permissionDesc}>Anyone can post to this channel</Text>
            </View>
            <TouchableOpacity 
              style={[styles.switch, nonAdminPosts && styles.switchActive]}
              onPress={() => setNonAdminPosts(!nonAdminPosts)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, nonAdminPosts && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow sharing</Text>
            <TouchableOpacity 
              style={[styles.switch, allowSharing && styles.switchActive]}
              onPress={() => setAllowSharing(!allowSharing)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowSharing && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow downloads</Text>
            <TouchableOpacity 
              style={[styles.switch, allowDownloads && styles.switchActive]}
              onPress={() => setAllowDownloads(!allowDownloads)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchThumb, allowDownloads && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Management Options */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => navigation.navigate('EditChannel', { channelId })}
          >
            <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>Edit Channel</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => navigation.navigate('ChannelAdminManagement', { channelId })}
          >
            <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>Manage Admins</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => navigation.navigate('ChannelAnalytics', { channelId })}
          >
            <Ionicons name="analytics-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => navigation.navigate('ChannelMonetization', { channelId })}
          >
            <Ionicons name="cash-outline" size={22} color={colors.primary} />
            <Text style={[styles.optionText, { color: colors.primary }]}>Monetization</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => navigation.navigate('ShareChannel', { channelId })}
          >
            <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>Share Channel</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            Alert.alert('Settings Saved', 'Your channel settings have been updated');
            navigation.goBack();
          }}
        >
          <Text style={styles.saveBtnText}>Update Channel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  section: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  radioLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  radioDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  permissionLabel: { fontSize: 15, color: colors.textPrimary },
  permissionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  switch: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border, padding: 2, justifyContent: 'center' },
  switchActive: { backgroundColor: colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  switchThumbActive: { alignSelf: 'flex-end' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  premiumBadge: { backgroundColor: '#FFD700', borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  premiumText: { fontSize: 10, fontWeight: '800', color: colors.navy, letterSpacing: 0.5 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
