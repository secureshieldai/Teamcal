import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import type { ChannelMember } from '../types/channels';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelFeed'>;

export default function ChannelAdminManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [admins, setAdmins] = useState<ChannelMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<ChannelMember | null>(null);
  const [permissionsModal, setPermissionsModal] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, [channelId]);

  const loadAdmins = async () => {
    try {
      const data = await channelsService.getAdmins(channelId);
      setAdmins(data);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleRemove = (member: ChannelMember) => {
    Alert.alert('Remove Admin', `Remove ${member.user?.name} as admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await channelsService.removeAdmin(channelId, member.user_id);
            loadAdmins();
          } catch (error) {
            Alert.alert('Error', (error as Error).message);
          }
        },
      },
    ]);
  };

  const togglePermission = async (permission: keyof ChannelMember) => {
    if (!selectedMember) return;
    try {
      await channelsService.updatePermissions(channelId, selectedMember.user_id, {
        [permission]: !selectedMember[permission],
      });
      loadAdmins();
      setPermissionsModal(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Admins</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.memberCard, shadow.soft]}>
            <Avatar uri={item.user?.avatar} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.memberName}>{item.user?.name}</Text>
              <Text style={styles.memberRole}>{item.role.toUpperCase()}</Text>
            </View>
            {item.role !== 'owner' && (
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setSelectedMember(item);
                    setPermissionsModal(true);
                  }}
                >
                  <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleRemove(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.macroProtein} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* Permissions Modal */}
      <Modal visible={permissionsModal} transparent animationType="slide" onRequestClose={() => setPermissionsModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Permissions</Text>
              <TouchableOpacity onPress={() => setPermissionsModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedMember && (
              <>
                <PermissionRow label="Can post" value={selectedMember.can_post} onToggle={() => togglePermission('can_post')} />
                <PermissionRow label="Can edit posts" value={selectedMember.can_edit} onToggle={() => togglePermission('can_edit')} />
                <PermissionRow label="Can delete posts" value={selectedMember.can_delete} onToggle={() => togglePermission('can_delete')} />
                <PermissionRow label="Can pin posts" value={selectedMember.can_pin} onToggle={() => togglePermission('can_pin')} />
                <PermissionRow label="Can moderate" value={selectedMember.can_moderate} onToggle={() => togglePermission('can_moderate')} />
                <PermissionRow label="Can manage" value={selectedMember.can_manage} onToggle={() => togglePermission('can_manage')} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PermissionRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.permRow} onPress={onToggle}>
      <Text style={styles.permLabel}>{label}</Text>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={22} color={value ? colors.primary : colors.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  list: { padding: spacing.lg },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  memberRole: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  permLabel: { fontSize: 15, color: colors.textPrimary },
});
