import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService, type TrackerLastNDay } from '../../services/api/tracker.service';
import { useAuth } from '../../context/AuthContext';

function formatDay(dayKey: string) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function StepsHistoryTab() {
  const { user } = useAuth();
  const goal = user?.goal_steps ?? 8000;
  const { data, loading, error } = useApiQuery(() => trackerService.getLastN('steps', 30), [] as TrackerLastNDay[], []);
  const reversed = [...data].reverse();

  return (
    <FlatList
      data={reversed}
      keyExtractor={(item) => item.day}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <Text style={styles.empty}>{loading ? 'Loading history…' : error ? `Unable to load: ${error}` : 'No step history yet.'}</Text>
      }
      renderItem={({ item }) => {
        const met = item.total >= goal;
        return (
          <View style={[styles.row, shadow.card]}>
            <View style={styles.info}>
              <Text style={styles.date}>{formatDay(item.day)}</Text>
              <Text style={styles.total}>{item.total.toLocaleString()} steps</Text>
            </View>
            <View style={[styles.badge, met ? styles.badgeMet : styles.badgeMissed]}>
              <Ionicons name={met ? 'checkmark' : 'close'} size={14} color={met ? colors.success : colors.textMuted} />
            </View>
          </View>
        );
      }}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
  },
  date: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  total: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMet: {
    backgroundColor: '#E4F8ED',
  },
  badgeMissed: {
    backgroundColor: colors.background,
  },
});
