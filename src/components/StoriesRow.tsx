import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, spacing, typography } from '../theme';

type Story = { id: string; label: string; avatar: string };

type Props = {
  currentUserAvatar: string;
  stories: Story[];
  onAddStory?: () => void;
  onPressStory?: (id: string) => void;
};

export default function StoriesRow({ currentUserAvatar, stories, onAddStory, onPressStory }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity style={styles.item} onPress={onAddStory}>
        <View style={styles.addCircle}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Add Story
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Avatar uri={currentUserAvatar} size={56} ringColor={colors.primary} />
        <Text style={styles.label} numberOfLines={1}>
          You
        </Text>
      </TouchableOpacity>

      {stories.map((story) => (
        <TouchableOpacity key={story.id} style={styles.item} onPress={() => onPressStory?.(story.id)}>
          <Avatar uri={story.avatar} size={56} ringColor={colors.primary} />
          <Text style={styles.label} numberOfLines={1}>
            {story.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const AVATAR_OUTER = 62;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    width: AVATAR_OUTER,
  },
  addCircle: {
    width: AVATAR_OUTER,
    height: AVATAR_OUTER,
    borderRadius: AVATAR_OUTER / 2,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
