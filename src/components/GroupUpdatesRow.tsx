import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import type { GroupStoryGroup } from '../services/api/groups.service';

type Props = {
  groups: GroupStoryGroup[];
  unseenGroupIds: Set<string>;
  onPressGroup: (group: GroupStoryGroup) => void;
};

const AVATAR_OUTER = 62;

/**
 * Homepage "Group Updates" row — distinct from the Social page's personal StoriesRow.
 * Each circle represents a group/community the user has joined, never a person.
 */
export default function GroupUpdatesRow({ groups, unseenGroupIds, onPressGroup }: Props) {
  if (!groups.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {groups.map((group) => {
        const unseen = unseenGroupIds.has(group.groupId);
        return (
          <TouchableOpacity key={group.groupId} style={styles.item} onPress={() => onPressGroup(group)} activeOpacity={0.8}>
            <View style={[styles.ring, unseen ? styles.ringUnseen : styles.ringSeen]}>
              {group.groupImage ? (
                <Image source={{ uri: group.groupImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{group.groupName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>{group.groupName}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, gap: spacing.md },
  item: { alignItems: 'center', width: AVATAR_OUTER },
  ring: {
    width: AVATAR_OUTER, height: AVATAR_OUTER, borderRadius: AVATAR_OUTER / 2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5,
  },
  ringUnseen: { borderColor: colors.primary },
  ringSeen: { borderColor: colors.border },
  avatar: { width: AVATAR_OUTER - 8, height: AVATAR_OUTER - 8, borderRadius: (AVATAR_OUTER - 8) / 2, backgroundColor: colors.border },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarInitial: { color: colors.white, fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
