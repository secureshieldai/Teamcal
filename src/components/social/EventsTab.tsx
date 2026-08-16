import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { EVENTS, type CommunityEvent } from '../../data/eventsData';
import { personalService } from '../../services/api/personal.service';
import EventDetailModal from './EventDetailModal';

function useToggleSet(kind: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    personalService.list(kind).then((rows) => setIds(new Set(rows.map((r) => r.external_key || '')))).catch(() => {});
  }, [kind]);

  const toggle = async (id: string, data: Record<string, unknown>) => {
    const was = ids.has(id);
    setIds((prev) => {
      const next = new Set(prev);
      if (was) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const active = await personalService.toggle(kind, id, data);
      setIds((prev) => {
        const next = new Set(prev);
        if (active) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        if (was) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  return { ids, toggle };
}

export default function EventsTab() {
  const bookmarks = useToggleSet('saved-event');
  const registrations = useToggleSet('event-registration');
  const reminders = useToggleSet('event-reminder');
  const [selected, setSelected] = useState<CommunityEvent | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Live Events</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>

      {EVENTS.map((event) => {
        const saved = bookmarks.ids.has(event.id);
        const registered = registrations.ids.has(event.id);
        const reminded = reminders.ids.has(event.id);
        return (
          <TouchableOpacity key={event.id} style={[styles.card, shadow.card]} activeOpacity={0.9} onPress={() => setSelected(event)}>
            <View style={styles.headerRow}>
              <Image source={{ uri: event.thumbnail }} style={styles.thumb} />
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.host}>with {event.hostName}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{event.dateLabel}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{event.goingCount} going</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => bookmarks.toggle(event.id, { title: event.title })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.description} numberOfLines={2}>{event.description}</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.remindBtn, reminded && styles.remindBtnActive]}
                onPress={() => reminders.toggle(event.id, { title: event.title })}
              >
                <Ionicons name={reminded ? 'notifications' : 'notifications-outline'} size={13} color={reminded ? colors.white : colors.primary} />
                <Text style={[styles.remindText, reminded && styles.remindTextActive]}>{reminded ? 'Reminder set' : 'Remind Me'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => registrations.toggle(event.id, { title: event.title })}
              >
                <Text style={styles.registerText}>{registered ? 'Registered ✓' : 'Register'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      <EventDetailModal
        event={selected}
        registered={selected ? registrations.ids.has(selected.id) : false}
        reminded={selected ? reminders.ids.has(selected.id) : false}
        onToggleRegister={() => selected && registrations.toggle(selected.id, { title: selected.title })}
        onToggleRemind={() => selected && reminders.toggle(selected.id, { title: selected.title })}
        onClose={() => setSelected(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#E0554F',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  host: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
  },
  remindBtnActive: {
    backgroundColor: colors.primary,
  },
  remindText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  remindTextActive: {
    color: colors.white,
  },
  registerBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
});
