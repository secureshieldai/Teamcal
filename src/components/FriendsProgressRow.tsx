import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import SectionHeader from './SectionHeader';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Friend = {
  id: string;
  name: string;
  avatar: string;
  isGroup?: boolean;
  calories?: string;
  percent?: number | null;
};

type Props = {
  friends: Friend[];
  onSeeAll?: () => void;
};

export default function FriendsProgressRow({ friends, onSeeAll }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Friends' Progress Today" actionLabel="See All" onPressAction={onSeeAll} style={styles.headerRow} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {friends.map((friend) => (
          <View key={friend.id} style={[styles.card, shadow.soft]}>
            <Avatar uri={friend.avatar} size={56} />
            <Text style={styles.name} numberOfLines={1}>
              {friend.name}
            </Text>
            {friend.calories ? <Text style={styles.calories}>{friend.calories}</Text> : null}
            {typeof friend.percent === 'number' ? <Text style={styles.percent}>{friend.percent}%</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    width: 92,
  },
  name: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  calories: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  percent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
});
