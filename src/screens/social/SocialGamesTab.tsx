import React from 'react';
import {
  Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../theme';

// TeamCal's own games — placeholder data until the real game assets arrive
const TEAMCAL_GAMES = [
  { id: 'pulse-runner',   name: 'Pulse Runner',    newPosts: 128, players: 28, color: '#FF6A2B', bg: '#1a0a00' },
  { id: 'tap-tempo',      name: 'Tap Tempo',       newPosts: 96,  players: 18, color: '#3E7BFA', bg: '#00091a' },
  { id: 'stack-tower',    name: 'Stack Tower',     newPosts: 76,  players: 21, color: '#8B5CF6', bg: '#0d0020' },
  { id: 'color-dash',     name: 'Color Dash',      newPosts: 64,  players: 15, color: '#2ED47A', bg: '#001a0c' },
  { id: 'calorie-quest',  name: 'Calorie Quest',   newPosts: 45,  players: 12, color: '#FFC542', bg: '#1a1200' },
  { id: 'step-sprint',    name: 'Step Sprint',     newPosts: 38,  players: 9,  color: '#FF4D5E', bg: '#1a0005' },
];

const TOURNAMENTS = [
  { id: 't1', game: 'Pulse Runner',  name: 'Pulse Runner Championship', type: 'Squad Tournament',  current: 64,  total: 128, gameId: 'pulse-runner',  color: '#FF6A2B' },
  { id: 't2', game: 'Stack Tower',   name: 'Stack Tower Challenge',     type: 'Solo Tournament',   current: 32,  total: 64,  gameId: 'stack-tower',   color: '#8B5CF6' },
  { id: 't3', game: 'Color Dash',    name: 'Color Dash League',         type: 'Team Tournament',   current: 48,  total: 96,  gameId: 'color-dash',    color: '#2ED47A' },
];

export default function SocialGamesTab({ ListHeaderComponent }: { ListHeaderComponent?: React.ReactElement }) {
  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {ListHeaderComponent}
      {/* Top Games Discussions */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Top Games Discussions</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.sm }}>
        {TEAMCAL_GAMES.map(game => (
          <TouchableOpacity key={game.id} style={[s.gameCard, { backgroundColor: game.bg }]} activeOpacity={0.85}>
            {/* Placeholder art — colored gradient box with icon */}
            <View style={[s.gameArt, { backgroundColor: game.color + '30' }]}>
              <Ionicons name="game-controller" size={32} color={game.color} />
            </View>
            <View style={s.gameFooter}>
              <Text style={s.gameName} numberOfLines={1}>{game.name}</Text>
              <Text style={s.gameNewPosts}>{game.newPosts} new posts</Text>
              <View style={s.avatarRow}>
                {Array.from({ length: Math.min(3, game.players) }).map((_, i) => (
                  <View key={i} style={[s.avatarDot, { backgroundColor: game.color, marginLeft: i > 0 ? -6 : 0 }]} />
                ))}
                <Text style={s.playerCount}>+{game.players}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ongoing Tournaments */}
      <View style={[s.sectionHeader, { marginTop: spacing.xl }]}>
        <Text style={s.sectionTitle}>Ongoing Tournaments</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: spacing.sm }}>
        {TOURNAMENTS.map(t => (
          <TouchableOpacity key={t.id} style={[s.tournamentRow, shadow.soft]} activeOpacity={0.8}>
            <View style={[s.tournamentIcon, { backgroundColor: t.color + '25' }]}>
              <Ionicons name="game-controller" size={22} color={t.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tournamentName}>{t.name}</Text>
              <Text style={s.tournamentType}>{t.type}</Text>
              <Text style={s.tournamentPlayers}>{t.current}/{t.total} Players</Text>
            </View>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live Now</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  gameCard: { width: 130, borderRadius: radii.xl, overflow: 'hidden' },
  gameArt: { height: 110, alignItems: 'center', justifyContent: 'center' },
  gameFooter: { padding: spacing.sm, gap: 3 },
  gameName: { fontSize: 12, fontWeight: '800', color: colors.white },
  gameNewPosts: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  avatarDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#000' },
  playerCount: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 4, fontWeight: '700' },
  tournamentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  tournamentIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tournamentName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  tournamentType: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  tournamentPlayers: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF0E8', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radii.pill },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  liveText: { fontSize: 11, fontWeight: '800', color: colors.primary },
});
