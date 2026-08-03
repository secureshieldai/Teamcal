import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import { colors, radii, spacing, typography } from '../../theme';
import { mockBlogPosts, type MockBlogComment } from '../../data/socialMockData';
import { useProfile } from '../../hooks/useProfile';
import type { RootStackParamList } from '../../navigation/types';
import { personalService } from '../../services/api/personal.service';
import {socialService} from '../../services/api/social.service';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogDetail'>;

const VISIBLE_COMMENTS = 3;

export default function BlogDetailScreen({ route, navigation }: Props) {
  const { blogId } = route.params;
  const [post,setPost]=useState(mockBlogPosts.find((p) => p.id === blogId) ?? mockBlogPosts[0]);
  const { profileUser } = useProfile();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<MockBlogComment[]>(post.comments);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(()=>{socialService.getSocialBlog(blogId).then(item=>{const mapped={id:item.id,image:item.cover||`https://picsum.photos/seed/${item.id}/600/400`,title:item.title,category:item.category||'Community',author:item.user?.name||'Creator',authorAvatar:item.user?.avatar||'',authorVerified:item.user?.verified,date:new Date(item.created_at).toLocaleDateString(),readMinutes:item.read_minutes||1,likes:0,commentCount:0,body:[{type:'paragraph' as const,text:item.body||''}],comments:[]};setPost(mapped);setLikeCount(0);setComments([]);}).catch(()=>{});},[blogId]);
  useEffect(() => {
    Promise.all([personalService.list('saved-blog'),personalService.list<MockBlogComment & {blogId:string}>('blog-comment'),personalService.list('liked-blog')]).then(([savedRows,commentRows,likedRows])=>{setSaved(savedRows.some(r=>r.external_key===post.id));setLiked(likedRows.some(r=>r.external_key===post.id));const mine=commentRows.filter(r=>r.data.blogId===post.id).map(r=>({...r.data,id:r.id}));setComments([...post.comments,...mine]);}).catch(()=>{});
  }, [post.id]);

  const toggleLike = async () => {
    const previous=liked;setLiked(!liked);setLikeCount(v=>Math.max(0,v+(liked?-1:1)));
    try{const active=await personalService.toggle('liked-blog',post.id,{title:post.title});setLiked(active);}catch{setLiked(previous);setLikeCount(v=>Math.max(0,v+(previous?1:-1)));}
  };

  const toggleSaved = async () => {
    const previous=saved;setSaved(!saved);try{setSaved(await personalService.toggle('saved-blog',post.id,{title:post.title,image:post.image}));}catch{setSaved(previous);}
  };

  const sendComment = async () => {
    if (!draft.trim()) return;
    const value={blogId:post.id,name:profileUser.name||'You',avatar:profileUser.avatar,time:'now',text:draft.trim(),likes:0};
    try{const record=await personalService.create('blog-comment',value,{externalKey:`${post.id}:${Date.now()}`});setComments(prev=>[...prev,{...value,id:record.id}]);setDraft('');setExpanded(true);}catch{}
  };

  const visibleComments = expanded ? comments : comments.slice(0, VISIBLE_COMMENTS);
  const hiddenCount = comments.length - visibleComments.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleSaved} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: spacing.lg }}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: post.image }} style={styles.hero} />

        <View style={styles.body}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{post.category}</Text>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.authorRow}>
            <Avatar uri={post.authorAvatar} size={34} />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.author}</Text>
                {post.authorVerified && <Ionicons name="checkmark-circle" size={13} color={colors.primary} />}
              </View>
              <Text style={styles.authorMeta}>{post.date} · {post.readMinutes} min read</Text>
            </View>
          </View>

          <ActionRow
            liked={liked}
            likeCount={likeCount}
            commentCount={comments.length}
            onLike={toggleLike}
            onShare={() => Share.share({ message: `${post.title} — ${post.author}` })}
          />

          {post.body.map((block, i) => {
            if (block.type === 'heading') {
              return <Text key={i} style={styles.heading}>{block.text}</Text>;
            }
            if (block.type === 'paragraph') {
              return <Text key={i} style={styles.paragraph}>{block.text}</Text>;
            }
            if (block.type === 'list') {
              return (
                <View key={i} style={styles.list}>
                  {block.items.map((item) => (
                    <View key={item} style={styles.listRow}>
                      <View style={styles.listDot} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            if (block.type === 'image') {
              return <Image key={i} source={{ uri: block.uri }} style={styles.bodyImage} />;
            }
            if (block.type === 'tip') {
              return (
                <View key={i} style={styles.tipRow}>
                  <Image source={{ uri: block.image }} style={styles.tipImage} />
                  <View style={styles.tipInfo}>
                    <Text style={styles.tipQuestion}>{block.question}</Text>
                    <Text style={styles.tipAnswer}>{block.answer}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={i} style={styles.quoteBox}>
                <Text style={styles.quoteText}>{'\u{201C}'} {block.text}</Text>
                <Ionicons name="heart-outline" size={16} color={colors.primary} style={styles.quoteHeart} />
              </View>
            );
          })}

          <ActionRow
            liked={liked}
            likeCount={likeCount}
            commentCount={comments.length}
            onLike={toggleLike}
            onShare={() => Share.share({ message: `${post.title} — ${post.author}` })}
          />

          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            <View style={styles.sortRow}>
              <Text style={styles.sortText}>Newest</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </View>
          </View>

          {visibleComments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Avatar uri={comment.avatar} size={36} />
              <View style={styles.commentBody}>
                <View style={styles.commentNameRow}>
                  <Text style={styles.commentName}>{comment.name}</Text>
                  {comment.verified && <Ionicons name="checkmark-circle" size={12} color={colors.primary} />}
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                <View style={styles.commentFooter}>
                  <Text style={styles.commentTime}>{comment.time}</Text>
                  <Text style={styles.commentReply}>Reply</Text>
                </View>
              </View>
              <View style={styles.commentLike}>
                <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                <Text style={styles.commentLikeCount}>{comment.likes}</Text>
              </View>
            </View>
          ))}

          {hiddenCount > 0 && (
            <TouchableOpacity onPress={() => setExpanded(true)}>
              <Text style={styles.viewMore}>View {hiddenCount} more comment{hiddenCount === 1 ? '' : 's'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={sendComment}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendComment} disabled={!draft.trim()}>
          <Ionicons name="send" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ActionRow({
  liked,
  likeCount,
  commentCount,
  onLike,
  onShare,
}: {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.actionItem} onPress={onLike}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.macroProtein : colors.textSecondary} />
        <Text style={styles.actionText}>{likeCount}</Text>
      </TouchableOpacity>
      <View style={styles.actionItem}>
        <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.actionText}>{commentCount}</Text>
      </View>
      <TouchableOpacity style={styles.actionItem} onPress={onShare}>
        <Ionicons name="share-social-outline" size={19} color={colors.textSecondary} />
        <Text style={styles.actionText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hero: {
    width: '100%',
    height: 260,
    backgroundColor: colors.border,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 27,
    marginTop: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  authorMeta: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  list: {
    marginTop: spacing.sm,
    gap: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  bodyImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    backgroundColor: colors.border,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tipImage: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  tipInfo: {
    flex: 1,
  },
  tipQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tipAnswer: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  quoteBox: {
    backgroundColor: '#FFEDE3',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  quoteText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteHeart: {
    marginBottom: 2,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  commentsTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  commentBody: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  commentText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
    marginTop: 2,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  commentTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  commentReply: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  commentLike: {
    alignItems: 'center',
    gap: 2,
  },
  commentLikeCount: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  viewMore: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
