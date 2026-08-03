import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService } from '../../services/api/tracker.service';
import { getDrinkType } from '../../data/waterData';
import type { TrackerEntry } from '../../types/api';

interface DayGroup {
  key: string;
  label: string;
  total: number;
  entries: TrackerEntry[];
}

function dateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WaterHistoryTab() {
  const { data: entries, loading, error } = useApiQuery(() => trackerService.getEntries('water', 200), [] as TrackerEntry[], []);

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const entry of entries) {
      const key = dateKey(entry.ts);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: new Date(entry.ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          total: 0,
          entries: [],
        });
      }
      const group = map.get(key)!;
      group.total += entry.value;
      group.entries.push(entry);
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [entries]);

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.key}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <Text style={styles.empty}>{loading ? 'Loading history…' : error ? `Unable to load: ${error}` : 'No water history yet.'}</Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, shadow.card]}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{item.label}</Text>
            <Text style={styles.dayTotal}>{item.total.toLocaleString()} ml</Text>
          </View>
          {item.entries.map((entry) => {
            const meta = entry.meta as { type?: string; rawMl?: number };
            const type = getDrinkType(meta.type ?? 'water');
            const raw = meta.rawMl ?? entry.value;
            return (
              <View key={entry.id} style={styles.entryRow}>
                <View style={[styles.entryIcon, { backgroundColor: type.background }]}>
                  <Ionicons name={type.icon} size={13} color={type.color} />
                </View>
                <Text style={styles.entryLabel}>{type.label} — {raw}ml</Text>
                <Text style={styles.entryTime}>
                  {new Date(entry.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dayTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  entryIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  entryTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
