import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';
import { colors, radii, spacing, typography } from '../theme';

type Creator = { id: string; name: string; handle: string; avatar: string };

export default function TopCreatorsList({ creators }: { creators: Creator[] }) {
  return (
    <View style={styles.list}>
      {creators.map((creator) => (
        <CreatorRow key={creator.id} creator={creator} />
      ))}
    </View>
  );
}

function CreatorRow({ creator }: { creator: Creator }) {
  const [following, setFollowing] = useState(false);

  return (
    <View style={styles.row}>
      <Avatar uri={creator.avatar} size={44} />
      <View style={styles.info}>
        <Text style={styles.name}>{creator.name}</Text>
        <Text style={styles.handle}>{creator.handle}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, following && styles.followingButton]}
        onPress={() => setFollowing((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.followText, following && styles.followingText]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  handle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 1,
  },
  followButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  followingButton: {
    backgroundColor: colors.primary,
  },
  followText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  followingText: {
    color: colors.white,
  },
});
