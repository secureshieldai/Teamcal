import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from './Avatar';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  isOwner?: boolean;
  level: number;
  levelName: string;
  levelProgress: number; // 0-100
  lifetimePoints: number;
  nextLevelPoints: number;
  spendablePoints: number;
};

export default function ProfileHeaderCard({
  name, handle, avatar, bio, isOwner = true,
  level, levelName, levelProgress, lifetimePoints, nextLevelPoints, spendablePoints,
}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View>
      <View style={styles.row}>
        <Avatar uri={avatar} size={64} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>{handle}</Text>
          {/* Level row */}
          <TouchableOpacity style={styles.levelRow} onPress={() => navigation.navigate('Levels')} activeOpacity={0.7}>
            <Text style={styles.levelLabel}>Level {level} — {levelName}</Text>
            <View style={styles.viewLevels}>
              <Text style={styles.viewLevelsText}>How Levels Work</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            {lifetimePoints.toLocaleString()}/{nextLevelPoints.toLocaleString()} pts to Level {level + 1}
            {'  ·  '}
            <Text style={{ color: colors.primary }}>{spendablePoints.toLocaleString()} to spend</Text>
          </Text>
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <Text style={styles.bio}>{bio}</Text>
      ) : isOwner ? (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
          <Text style={styles.addBio}>+ Add bio</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1, marginLeft: spacing.lg },
  name: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  handle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  levelLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  viewLevels: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLevelsText: { fontSize: 10.5, fontWeight: '600', color: colors.primary },
  chevron: { fontSize: 13, color: colors.primary },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.ringTrack, marginTop: 5 },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  progressCaption: { fontSize: 10.5, color: colors.textMuted, marginTop: 3 },
  bio: { fontSize: 13.5, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 19 },
  addBio: { fontSize: 13, color: colors.primary, marginTop: spacing.sm, fontWeight: '600' },
});
