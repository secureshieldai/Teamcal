import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';
import type { GroupStoryGroup } from '../services/api/groups.service';

type Props = {
  group: GroupStoryGroup | null;
  onClose: () => void;
  onOpenGroup: (groupId: string) => void;
  onViewPost: (groupId: string, postId: string) => void;
};

/**
 * Full-screen sequence of recent post previews for ONE group — the homepage
 * "Group Updates" equivalent of a story viewer. Not to be confused with the
 * Social page's personal StoryComposer/viewer, which shows individual posts.
 */
export default function GroupStoryViewer({ group, onClose, onOpenGroup, onViewPost }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  if (!group) return null;
  const posts = group.posts;
  const post = posts[Math.min(index, posts.length - 1)];
  if (!post) return null;

  const goNext = () => { if (index < posts.length - 1) setIndex(i => i + 1); else close(); };
  const goPrev = () => { if (index > 0) setIndex(i => i - 1); };
  const close = () => { setIndex(0); onClose(); };

  const image = post.image_urls?.[0] || post.image;

  return (
    <Modal visible={!!group} animationType="fade" onRequestClose={close}>
      <View style={s.container}>
        {/* Progress segments */}
        <View style={[s.progressRow, { top: insets.top + spacing.xs }]}>
          {posts.map((p, i) => (
            <View key={p.id} style={s.progressTrack}>
              <View style={[s.progressFill, { width: i < index ? '100%' : i === index ? '50%' : '0%' }]} />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={[s.header, { top: insets.top + spacing.lg }]}>
          <View style={s.groupBadge}>
            {group.groupImage ? <Image source={{ uri: group.groupImage }} style={s.groupAvatar} /> : <View style={[s.groupAvatar, s.groupAvatarPlaceholder]} />}
            <View>
              <Text style={s.groupName} numberOfLines={1}>{group.groupName}</Text>
              <Text style={s.postMeta}>{post.user?.name || 'Member'} · {timeAgo(post.created_at)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {image ? (
          <Image source={{ uri: image }} style={s.postImage} resizeMode="cover" />
        ) : (
          <View style={s.textOnly}><Text style={s.textOnlyText}>{post.text}</Text></View>
        )}
        {!!image && !!post.text && (
          <View style={s.captionWrap}><Text style={s.caption} numberOfLines={3}>{post.text}</Text></View>
        )}

        {/* Tap zones for prev/next */}
        <TouchableOpacity style={s.tapLeft} onPress={goPrev} />
        <TouchableOpacity style={s.tapRight} onPress={goNext} />

        {/* Actions */}
        <View style={[s.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TouchableOpacity style={s.outlineBtn} onPress={() => onViewPost(group.groupId, post.id)}>
            <Text style={s.outlineBtnText}>View Full Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fillBtn} onPress={() => onOpenGroup(group.groupId)}>
            <Text style={s.fillBtnText}>Open Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function timeAgo(iso: string) {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressRow: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', gap: 4, zIndex: 3 },
  progressTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  header: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 },
  groupBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, marginRight: spacing.md },
  groupAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  groupAvatarPlaceholder: { backgroundColor: colors.primary },
  groupName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  postMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  postImage: { flex: 1, width: '100%' },
  textOnly: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: '#1a1a1a' },
  textOnlyText: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  captionWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 96 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18 },
  tapLeft: { position: 'absolute', left: 0, top: 80, bottom: 80, width: '35%' },
  tapRight: { position: 'absolute', right: 0, top: 80, bottom: 80, width: '35%' },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  outlineBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1.5, borderColor: '#fff' },
  outlineBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fillBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primary },
  fillBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
