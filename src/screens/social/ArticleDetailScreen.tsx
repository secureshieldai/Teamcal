import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { blogsService, type BlogArticle, type BlogSite } from '../../services/api/blogs.service';
import { socialService, type ArticleComment } from '../../services/api/social.service';
import { articleMarkdownIt, articleMarkdownRules, articleMarkdownStyle } from '../../data/articleMarkdown';
import Avatar from '../../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  scheduled: { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF', icon: 'time-outline' },
  archived: { label: 'Archived', color: '#6B7280', bg: '#F3F4F6', icon: 'archive-outline' },
  unpublished: { label: 'Unpublished', color: '#F59E0B', bg: '#FEF3C7', icon: 'eye-off-outline' },
  draft: { label: 'Draft', color: '#F59E0B', bg: '#FEF3C7', icon: 'create-outline' },
  paused: { label: 'Paused', color: '#F59E0B', bg: '#FEF3C7', icon: 'pause-circle-outline' },
};

export default function ArticleDetailScreen({ route, navigation }: Props) {
  const { articleId } = route.params;
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [blogSite, setBlogSite] = useState<BlogSite | null>(null);
  const [morePosts, setMorePosts] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        let art: BlogArticle;
        let owner = false;
        try {
          art = await blogsService.getArticle(articleId);
          owner = true;
        } catch {
          const pub = await socialService.getSocialBlog(articleId);
          art = {
            id: pub.id, blog_id: pub.blog_id, title: pub.title, cover: pub.cover, body: pub.body,
            category: pub.category, status: 'published', views: pub.views, earned: 0,
            read_minutes: pub.read_minutes, created_at: pub.created_at, tags: [],
          };
        }
        if (!active) return;
        setArticle(art);
        setIsOwner(owner);

        blogsService.getSite(art.blog_id).catch(() => blogsService.getPublicBlog(art.blog_id)).then(site => {
          if (active) setBlogSite(site);
        }).catch(() => undefined);

        if (art.status === 'published') {
          socialService.getArticleEngagement(articleId).then(eng => {
            if (!active) return;
            setLikes(eng.likes); setLiked(eng.liked); setComments(eng.comments);
          }).catch(() => undefined);

          blogsService.articles(art.blog_id).then(list => {
            if (!active) return;
            setMorePosts(list.filter(p => p.id !== articleId && p.status === 'published').slice(0, 5));
          }).catch(() => undefined);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [articleId]);

  const toggleLike = async () => {
    const prevLiked = liked, prevLikes = likes;
    setLiked(!prevLiked); setLikes(l => l + (prevLiked ? -1 : 1));
    try {
      const r = await socialService.toggleArticleLike(articleId);
      setLiked(r.liked); setLikes(r.likes);
    } catch {
      setLiked(prevLiked); setLikes(prevLikes);
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    setCommentText('');
    try {
      const comment = await socialService.addArticleComment(articleId, text);
      setComments(prev => [comment, ...prev]);
    } catch (e) {
      Alert.alert('Unable to post comment', (e as Error).message);
      setCommentText(text);
    } finally {
      setPosting(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c));
    try {
      const r = await socialService.toggleArticleCommentLike(articleId, commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, liked: r.liked, likes: r.likes } : c));
    } catch { /* leave optimistic state */ }
  };

  const publicLink = article ? `https://teamcal.blog/articles/${article.id}` : '';
  const shareArticle = () => article && Share.share({ message: `${article.title} — ${publicLink}` });

  const editPost = () => { setSettingsOpen(false); if (article) navigation.navigate('ArticleEditor', { blogId: article.blog_id, articleId: article.id }); };
  const copyLink = async () => { await Clipboard.setStringAsync(publicLink); setSettingsOpen(false); Alert.alert('Post link copied.'); };
  const unpublishPost = () => {
    if (!article) return;
    Alert.alert('Unpublish this post?', 'It will no longer be visible to readers. You can publish it again at any time from the editor.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unpublish Post', style: 'destructive', onPress: async () => {
        try {
          await blogsService.updateArticle(article.id, { status: 'unpublished' });
          setSettingsOpen(false);
          navigation.goBack();
        } catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);
  };
  const deletePost = () => {
    if (!article) return;
    Alert.alert('Delete this post?', 'This will permanently delete the post. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await blogsService.deleteArticle(article.id);
          setSettingsOpen(false);
          navigation.goBack();
          setTimeout(() => Alert.alert('Post deleted.'), 300);
        } catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header title="" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header title="" onBack={() => navigation.goBack()} />
        <View style={s.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorTitle}>Unable to load article</Text>
          <Text style={s.errorSub}>{error || 'Article not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPublished = article.status === 'published';
  const date = new Date(article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const readTime = `${article.read_minutes || 1} min read`;

  // ── Preview mode: draft / scheduled / archived / unpublished ──
  if (!isPublished) {
    const status = STATUS_INFO[article.status] || STATUS_INFO.draft;
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header title={blogSite?.name || 'Preview'} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.statusBanner, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[s.statusBannerText, { color: status.color }]}>
              {status.label}{article.scheduled_for ? ` for ${new Date(article.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''} · Private preview
            </Text>
          </View>
          {article.cover ? <Image source={{ uri: article.cover }} style={s.cover} resizeMode="cover" /> : null}
          <View style={s.body}>
            {article.category ? (
              <View style={s.categoryPill}><Text style={s.categoryText}>{article.category}</Text></View>
            ) : null}
            <Text style={s.title}>{article.title}</Text>
            <View style={s.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={s.metaText}>{readTime}</Text>
              <Text style={s.metaDot}>·</Text>
              <Text style={s.metaText}>{date}</Text>
            </View>
            {article.excerpt ? <Text style={s.excerpt}>{article.excerpt}</Text> : null}
            {article.body ? (
              <Markdown markdownit={articleMarkdownIt} rules={articleMarkdownRules} style={articleMarkdownStyle}>{article.body}</Markdown>
            ) : <Text style={s.noContent}>No content yet.</Text>}
          </View>
          {isOwner && (
            <TouchableOpacity style={s.editPostBtn} onPress={editPost}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={s.editPostBtnText}>Edit Post</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Full published reader ──
  const headerTitle = scrolledPastHero ? article.title : (blogSite?.name || article.title);
  const authorName = blogSite?.author?.name || 'Creator';
  const authorAvatar = blogSite?.author?.avatar || '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header
        title={headerTitle}
        onBack={() => navigation.goBack()}
        onSave={() => setSaved(v => !v)}
        saved={saved}
        onShare={shareArticle}
        onSettings={isOwner ? () => setSettingsOpen(true) : undefined}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          onScroll={e => {
            const y = e.nativeEvent.contentOffset.y;
            const past = y > 40;
            setScrolledPastHero(prev => (prev === past ? prev : past));
          }}
          scrollEventThrottle={32}
        >
          {article.cover ? <Image source={{ uri: article.cover }} style={s.cover} resizeMode="cover" /> : null}

          <View style={s.body}>
            {article.category ? (
              <View style={s.categoryPill}><Text style={s.categoryText}>{article.category}</Text></View>
            ) : null}
            <Text style={s.title}>{article.title}</Text>

            <View style={s.authorRow}>
              <Avatar uri={authorAvatar} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>{authorName}</Text>
                <Text style={s.metaText}>Published {date} · {readTime}</Text>
              </View>
              {blogSite ? (
                <TouchableOpacity onPress={() => navigation.navigate('BlogPublic', { blogId: article.blog_id, isOwner })}>
                  <Text style={s.viewBlogLink}>View {blogSite.name} &gt;</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {article.excerpt ? <Text style={s.excerpt}>{article.excerpt}</Text> : null}

            {article.body ? (
              <Markdown markdownit={articleMarkdownIt} rules={articleMarkdownRules} style={articleMarkdownStyle}>{article.body}</Markdown>
            ) : <Text style={s.noContent}>No content available.</Text>}

            {article.tags && article.tags.length > 0 ? (
              <View style={s.tagsWrap}>
                {article.tags.map(tag => (
                  <View key={tag} style={s.tag}><Text style={s.tagText}>#{tag}</Text></View>
                ))}
              </View>
            ) : null}

            {/* Likes / comments summary */}
            <View style={s.engagementRow}>
              <TouchableOpacity style={s.engagementItem} onPress={toggleLike}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#EF4444' : colors.textSecondary} />
                <Text style={s.engagementText}>{likes} like{likes === 1 ? '' : 's'}</Text>
              </TouchableOpacity>
              <View style={s.engagementItem}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                <Text style={s.engagementText}>{comments.length} comment{comments.length === 1 ? '' : 's'}</Text>
              </View>
            </View>

            {/* Comments */}
            <Text style={s.commentsHeading}>Comments</Text>
            <View style={s.commentInputRow}>
              <TextInput
                style={s.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Leave a comment…"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity style={[s.commentSendBtn, (!commentText.trim() || posting) && { opacity: 0.4 }]} disabled={!commentText.trim() || posting} onPress={submitComment}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {comments.map(c => (
              <View key={c.id} style={s.commentRow}>
                <Avatar uri={c.avatar} size={30} />
                <View style={{ flex: 1 }}>
                  <View style={s.commentTopRow}>
                    <Text style={s.commentAuthor}>{c.name}</Text>
                    <Text style={s.commentTime}>{c.time}</Text>
                  </View>
                  <Text style={s.commentText}>{c.text}</Text>
                  <TouchableOpacity style={s.commentLikeBtn} onPress={() => toggleCommentLike(c.id)}>
                    <Ionicons name={c.liked ? 'heart' : 'heart-outline'} size={13} color={c.liked ? '#EF4444' : colors.textMuted} />
                    {c.likes > 0 && <Text style={s.commentLikeCount}>{c.likes}</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {!comments.length && <Text style={s.noComments}>Be the first to comment.</Text>}

            {/* Author card */}
            {blogSite && (
              <View style={s.authorCard}>
                <Avatar uri={authorAvatar} size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={s.authorCardName}>{authorName}</Text>
                  <Text style={s.authorCardRole}>Writer of {blogSite.name}</Text>
                  {blogSite.description ? <Text style={s.authorCardBio} numberOfLines={2}>{blogSite.description}</Text> : null}
                  <TouchableOpacity style={s.viewBlogBtn} onPress={() => navigation.navigate('BlogPublic', { blogId: article.blog_id, isOwner })}>
                    <Text style={s.viewBlogBtnText}>View Blog</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* More from this blog */}
            {morePosts.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={s.moreFromHeading}>More from {blogSite?.name || 'this blog'}</Text>
                {morePosts.map(p => (
                  <TouchableOpacity key={p.id} style={s.moreRow} onPress={() => navigation.replace('ArticleDetail', { articleId: p.id, blogId: article.blog_id, isOwner })}>
                    <Image source={{ uri: p.cover || `https://picsum.photos/seed/${p.id}/120/120` }} style={s.moreThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.moreTitle} numberOfLines={2}>{p.title}</Text>
                      <Text style={s.metaText}>{p.read_minutes || 1} min read</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Post Settings sheet ── */}
      {settingsOpen && (
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSettingsOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.settingsSheet}>
            <View style={s.sheetHandle} />
            <Text style={s.settingsTitle}>Post Settings</Text>
            <View style={s.settingsPostCard}>
              <Image source={{ uri: article.cover || `https://picsum.photos/seed/${article.id}/120/120` }} style={s.settingsThumb} />
              <View style={{ flex: 1 }}>
                <Text style={s.settingsPostTitle} numberOfLines={2}>{article.title}</Text>
                <Text style={s.settingsPublished}>Published</Text>
                <Text style={s.metaText}>{date}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.settingsRow} onPress={editPost}>
              <Ionicons name="create-outline" size={19} color={colors.primary} />
              <Text style={s.settingsRowText}>Edit Post</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.settingsRow} onPress={copyLink}>
              <Ionicons name="link-outline" size={19} color={colors.primary} />
              <Text style={s.settingsRowText}>Copy Post Link</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.settingsRow} onPress={unpublishPost}>
              <Ionicons name="eye-off-outline" size={19} color={colors.primary} />
              <Text style={s.settingsRowText}>Unpublish Post</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.settingsRow, { borderBottomWidth: 0 }]} onPress={deletePost}>
              <Ionicons name="trash-outline" size={19} color="#EF4444" />
              <Text style={[s.settingsRowText, { color: '#EF4444' }]}>Delete Post</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={s.settingsFootnote}>Changes apply only to this blog post.</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function Header({
  title, onBack, onSave, saved, onShare, onSettings,
}: {
  title: string; onBack: () => void; onSave?: () => void; saved?: boolean; onShare?: () => void; onSettings?: () => void;
}) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={s.headerRight}>
        {onSave ? (
          <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        {onShare ? (
          <TouchableOpacity onPress={onShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        {onSettings ? (
          <TouchableOpacity onPress={onSettings} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        {!onSave && !onShare && !onSettings ? <View style={{ width: 20 }} /> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background,
  },
  headerTitle: { ...typography.h2, fontSize: 14, color: colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
  headerRight: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', minWidth: 20 },
  scroll: { paddingBottom: spacing.xxl },
  cover: { width: '100%', height: 220, backgroundColor: colors.border },
  body: { padding: spacing.lg },
  categoryPill: { alignSelf: 'flex-start', backgroundColor: `${colors.primary}18`, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginBottom: spacing.md },
  categoryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 32, marginBottom: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  authorName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  viewBlogLink: { fontSize: 11, fontWeight: '700', color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.md, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: colors.textMuted },
  metaDot: { fontSize: 12, color: colors.textMuted },
  excerpt: { fontSize: 15, color: colors.textSecondary, lineHeight: 23, fontStyle: 'italic', marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  noContent: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  tag: { backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  // Preview mode (non-published)
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  statusBannerText: { fontSize: 12, fontWeight: '700' },
  editPostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginHorizontal: spacing.lg },
  editPostBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Engagement
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  engagementItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  engagementText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },

  // Comments
  commentsHeading: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.lg },
  commentInput: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary, maxHeight: 100 },
  commentSendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  commentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  commentTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentAuthor: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  commentTime: { fontSize: 10.5, color: colors.textMuted },
  commentText: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  commentLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  commentLikeCount: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  noComments: { fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.lg },

  // Author card
  authorCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  authorCardName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  authorCardRole: { fontSize: 11.5, color: colors.primary, fontWeight: '700', marginTop: 2 },
  authorCardBio: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  viewBlogBtn: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 5, marginTop: spacing.sm },
  viewBlogBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // More from
  moreFromHeading: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  moreRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  moreThumb: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.border },
  moreTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 18 },

  // Settings sheet
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  settingsSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  settingsTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  settingsPostCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  settingsThumb: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.border },
  settingsPostTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 17 },
  settingsPublished: { fontSize: 11.5, fontWeight: '700', color: colors.success, marginTop: 3 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsRowText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  settingsFootnote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
