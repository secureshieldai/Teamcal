import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { LIVE_STREAMS } from '../../data/liveData';
import { personalService } from '../../services/api/personal.service';

export default function LiveTab() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    personalService.list('saved-live').then((rows) => setSavedIds(new Set(rows.map((r) => r.external_key || '')))).catch(() => {});
  }, []);

  const toggleSaved = async (id: string, data: { title: string; thumbnail: string }) => {
    const wasSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const active = await personalService.toggle('saved-live', id, data);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (active) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const startLive = () => Alert.alert('Live streaming coming soon', "This build doesn't support broadcasting yet — check back in a future update.");

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goLiveCard}>
        <View style={styles.goLiveIcon}>
          <Ionicons name="radio" size={20} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goLiveTitle}>Go Live</Text>
          <Text style={styles.goLiveSubtitle}>Share with the community in real time</Text>
        </View>
        <TouchableOpacity style={styles.startLiveBtn} onPress={startLive} activeOpacity={0.85}>
          <Text style={styles.startLiveText}>Start Live</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live Now</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>

      {LIVE_STREAMS.map((stream) => {
        const saved = savedIds.has(stream.id);
        return (
          <View key={stream.id} style={[styles.streamRow, shadow.soft]}>
            <View>
              <Image source={{ uri: stream.thumbnail }} style={styles.thumb} />
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              <View style={styles.viewerBadge}>
                <Ionicons name="eye" size={10} color={colors.white} />
                <Text style={styles.viewerText}>{stream.viewerCount >= 1000 ? `${(stream.viewerCount / 1000).toFixed(1)}K` : stream.viewerCount}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
              <Text style={styles.streamCreator}>{stream.creatorName}</Text>
              <Text style={styles.streamCategory}>{stream.category}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleSaved(stream.id, { title: stream.title, thumbnail: stream.thumbnail })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  goLiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  goLiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  goLiveSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  startLiveBtn: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  startLiveText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
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
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
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
    fontSize: 8.5,
    fontWeight: '800',
  },
  viewerBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  viewerText: {
    color: colors.white,
    fontSize: 8.5,
    fontWeight: '700',
  },
  streamTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  streamCreator: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  streamCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
