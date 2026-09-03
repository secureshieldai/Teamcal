import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { socialService } from '../../services/api/social.service';

type SocialEvent = {
  id: string; title: string; description: string; host: string;
  hostAvatar: string; cover: string; date: string; time: string;
  category: string; registered: boolean; reminded: boolean; registrations: number;
};

export default function SocialEventsTab({ ListHeaderComponent }: { ListHeaderComponent?: React.ReactElement }) {
  const events = useApiQuery<SocialEvent[]>(() =>
    socialService.getEvents?.() ?? Promise.resolve([]), [], []);

  return (
    <FlatList
      data={events.data}
      keyExtractor={item => item.id}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !events.loading ? (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No upcoming events</Text>
            <Text style={s.emptySub}>Check back soon for scheduled live sessions and events.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => <EventCard event={item} />}
    />
  );
}

function EventCard({ event }: { event: SocialEvent }) {
  const [registered, setRegistered] = useState(event.registered);
  const [reminded, setReminded] = useState(event.reminded);

  const handleRegister = async () => {
    try {
      await socialService.registerEvent?.(event.id);
      setRegistered(true);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  return (
    <TouchableOpacity style={[s.card, shadow.soft]} activeOpacity={0.85}>
      <View style={s.coverWrap}>
        <Image source={{ uri: event.cover || `https://picsum.photos/seed/${event.id}/400/200` }} style={s.cover} />
        <TouchableOpacity
          style={s.bookmarkBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setReminded(r => !r)}
        >
          <Ionicons name={reminded ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{event.title}</Text>
        <Text style={s.desc} numberOfLines={2}>{event.description}</Text>

        <View style={s.hostRow}>
          <Image source={{ uri: event.hostAvatar || `https://picsum.photos/seed/${event.id}h/40/40` }} style={s.hostAvatar} />
          <Text style={s.hostName}>{event.host}</Text>
        </View>

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={s.metaText}>{event.date}</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={s.metaText}>{event.time}</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
            <Text style={s.metaText}>{event.registrations} registered</Text>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.reminderBtn, reminded && s.reminderBtnActive]}
            onPress={() => setReminded(r => !r)}
          >
            <Ionicons name={reminded ? 'notifications' : 'notifications-outline'} size={14} color={reminded ? colors.primary : colors.textSecondary} />
            <Text style={[s.reminderBtnText, reminded && s.reminderBtnTextActive]}>
              {reminded ? 'Reminder On' : 'Remind Me'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.registerBtn, registered && s.registerBtnDone]}
            onPress={registered ? undefined : handleRegister}
          >
            <Text style={s.registerBtnText}>{registered ? 'Registered ✓' : 'Register'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  coverWrap: { height: 170, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  bookmarkBtn: { position: 'absolute', top: 10, right: 12 },
  body: { padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  desc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border },
  hostName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, justifyContent: 'center' },
  reminderBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  reminderBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  reminderBtnTextActive: { color: colors.primary },
  registerBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  registerBtnDone: { backgroundColor: colors.success },
  registerBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});
