import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import type { CommunityEvent } from '../../data/eventsData';

type Props = {
  event: CommunityEvent | null;
  registered: boolean;
  reminded: boolean;
  onToggleRegister: () => void;
  onToggleRemind: () => void;
  onClose: () => void;
};

export default function EventDetailModal({ event, registered, reminded, onToggleRegister, onToggleRemind, onClose }: Props) {
  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {event && (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View>
                <Image source={{ uri: event.thumbnail }} style={styles.image} />
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.host}>with {event.hostName}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{event.dateLabel}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{event.goingCount} going</Text>
                </View>

                <Text style={styles.description}>{event.description}</Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.remindBtn, reminded && styles.remindBtnActive]} onPress={onToggleRemind}>
                    <Ionicons name={reminded ? 'notifications' : 'notifications-outline'} size={15} color={reminded ? colors.white : colors.primary} />
                    <Text style={[styles.remindText, reminded && styles.remindTextActive]}>{reminded ? 'Reminder set' : 'Remind Me'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.registerBtn} onPress={onToggleRegister}>
                    <Text style={styles.registerText}>{registered ? 'Registered ✓' : 'Register'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, maxHeight: '85%' },
  image: { width: '100%', height: 200, backgroundColor: colors.border },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  host: { fontSize: 13, color: colors.textSecondary, marginTop: -2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  description: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  remindBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, justifyContent: 'center' },
  remindBtnActive: { backgroundColor: colors.primary },
  remindText: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  remindTextActive: { color: colors.white },
  registerBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  registerText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
});
