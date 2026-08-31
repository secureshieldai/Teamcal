import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { blogsService, type BlogArticle, type BlogSite } from '../../services/api/blogs.service';
import { socialService } from '../../services/api/social.service';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogPublic'>;

const NAV_TABS = ['Home', 'Posts', 'Categories', 'About'] as const;
type NavTab = (typeof NAV_TABS)[number];

export default function BlogPublicScreen({ route, navigation }: Props) {
  const { blogId, isOwner } = route.params;
  const [blog, setBlog] = useState<BlogSite | null>(null);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<NavTab>('Home');
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [site, arts, analytics] = await Promise.all([
          blogsService.getPublicBlog(blogId),
          blogsService.articles(blogId),
          blogsService.analytics(blogId).catch(() => ({
            followers: 0, posts: 0, views: 0, earned: 0,
            averageReadMinutes: 0, comments: 0, published: 0,
          })),
        ]);
        setBlog(site);
        setFollowerCount(analytics.followers);
        setArticles(arts.filter(a => a.status === 'published'));
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blogId]);

  const toggleFollow = async () => {
    const prev = following;
    setFollowing(!prev);
    setFollowerCount(c => Math.max(0, c + (prev ? -1 : 1)));
    try {
      const result = await socialService.toggleBlogFollow(blogId);
      setFollowing(result);
    } catch {
      setFollowing(prev);
      setFollowerCount(c => Math.max(0, c + (prev ? 1 : -1)));
    }
  };

  const categories = useMemo(() => {
    const cats = articles.map(a => a.category).filter(Boolean) as string[];
    return [...new Set(cats)];
  }, [articles]);

  const featuredPost = blog?.featuredArticleId
    ? articles.find(a => a.id === blog.featuredArticleId)
    : articles[0];

  const filteredArticles = useMemo(() => {
    let list = articles;
    if (searchQuery) list = list.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory) list = list.filter(a => a.category === selectedCategory);
    return list;
  }, [articles, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <NavBar title="" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (loadError || !blog) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <NavBar title="Blog" onBack={() => navigation.goBack()} />
        <View style={s.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorTitle}>Unable to load blog</Text>
          <Text style={s.errorSub}>{loadError || 'Blog not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bannerUri = blog.banner || blog.cover || null;
  const isDraft = blog.status === 'draft' || blog.status === 'Draft';

  const openPost = (articleId: string) =>
    navigation.navigate('ArticleDetail', { articleId, blogId, isOwner });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <NavBar
        title={blog.name}
        onBack={() => navigation.goBack()}
        onShare={() => Share.share({ message: `Check out ${blog.name}: https://${blog.slug}.teamcal.blog` })}
      />

      {isDraft && isOwner && (
        <View style={s.draftBanner}>
          <Ionicons name="eye-off-outline" size={14} color={colors.white} />
          <Text style={s.draftText}>Draft Preview — not visible to the public</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Banner + avatar overlap */}
        <View style={s.bannerWrap}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={s.banner} resizeMode="cover" />
          ) : (
            <View style={[s.banner, s.bannerPlaceholder]}>
              <Ionicons name="image-outline" size={36} color={colors.textMuted} />
            </View>
          )}
          <View style={s.avatarWrap}>
            <Avatar uri={blog.author?.avatar || ''} size={68} />
          </View>
        </View>

        {/* Blog meta */}
        <View style={s.metaBlock}>
          <Text style={s.blogTitle}>{blog.name}</Text>
          {blog.description ? <Text style={s.blogDesc}>{blog.description}</Text> : null}
          {blog.author?.name ? (
            <TouchableOpacity
              onPress={() => blog.author && navigation.navigate('UserProfile', { userId: blog.author.id, username: blog.author.username })}
              activeOpacity={0.75}
            >
              <Text style={s.byLine}>By <Text style={s.byAuthor}>{blog.author.name}</Text></Text>
            </TouchableOpacity>
          ) : null}
          <View style={s.statsRow}>
            {blog.category ? (
              <View style={s.statItem}>
                <Ionicons name="pricetag-outline" size={13} color={colors.textSecondary} />
                <Text style={s.statText}>{blog.category}</Text>
              </View>
            ) : null}
            <View style={s.statItem}>
              <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
              <Text style={s.statText}>{followerCount.toLocaleString()} followers</Text>
            </View>
          </View>
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={[s.followBtn, following && s.followingBtn]}
              onPress={toggleFollow}
              activeOpacity={0.85}
            >
              <Text style={[s.followBtnText, following && s.followingBtnText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.shareBtn}
              onPress={() => Share.share({ message: `Check out ${blog.name}: https://${blog.slug}.teamcal.blog` })}
              activeOpacity={0.85}
            >
              <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabsRow}>
          {NAV_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => { setActiveTab(tab); setSearchVisible(false); setSearchQuery(''); setSelectedCategory(''); }}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={s.tabSearch}
            onPress={() => { setSearchVisible(v => !v); setSearchQuery(''); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={searchVisible ? 'close' : 'search'} size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {searchVisible && (
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={15} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search posts…"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── HOME ── */}
        {activeTab === 'Home' && !searchVisible && (
          <>
            {featuredPost && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Featured</Text>
                <FeaturedCard article={featuredPost} onPress={() => openPost(featuredPost.id)} />
              </View>
            )}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Latest posts</Text>
                {articles.length > 4 && (
                  <TouchableOpacity onPress={() => setActiveTab('Posts')}>
                    <Text style={s.viewAll}>View all</Text>
                  </TouchableOpacity>
                )}
              </View>
              {articles.length === 0 ? (
                <EmptyState message="No posts have been published yet." />
              ) : (
                articles.slice(0, 4).map(a => (
                  <PostCard key={a.id} article={a} onPress={() => openPost(a.id)} />
                ))
              )}
            </View>
          </>
        )}

        {/* ── POSTS / SEARCH ── */}
        {(activeTab === 'Posts' || searchVisible) && (
          <View style={s.section}>
            {filteredArticles.length === 0 ? (
              <EmptyState message={searchQuery ? 'No posts match your search.' : 'No posts have been published yet.'} />
            ) : (
              filteredArticles.map(a => (
                <PostCard key={a.id} article={a} onPress={() => openPost(a.id)} />
              ))
            )}
          </View>
        )}

        {/* ── CATEGORIES ── */}
        {activeTab === 'Categories' && !searchVisible && (
          <View style={s.section}>
            {categories.length === 0 ? (
              <EmptyState message="No categories yet." />
            ) : (
              <>
                <View style={s.categoryChips}>
                  <TouchableOpacity
                    style={[s.chip, !selectedCategory && s.chipActive]}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text style={[s.chipText, !selectedCategory && s.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[s.chip, selectedCategory === cat && s.chipActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filteredArticles.map(a => (
                  <PostCard key={a.id} article={a} onPress={() => openPost(a.id)} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── ABOUT ── */}
        {activeTab === 'About' && !searchVisible && (
          <View style={s.section}>
            <View style={[s.aboutCard, shadow.soft]}>
              <Text style={s.aboutDesc}>{blog.description || 'No description provided.'}</Text>
              {blog.author && (
                <TouchableOpacity
                  style={s.aboutAuthorRow}
                  onPress={() => navigation.navigate('UserProfile', { userId: blog.author!.id, username: blog.author!.username })}
                  activeOpacity={0.75}
                >
                  <Avatar uri={blog.author.avatar || ''} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.aboutAuthorLabel}>Written by</Text>
                    <Text style={s.aboutAuthorName}>{blog.author.name}</Text>
                    <Text style={s.aboutAuthorLink}>View profile →</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NavBar({ title, onBack, onShare }: { title: string; onBack: () => void; onShare?: () => void }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={s.headerRight}>
        {onShare && (
          <TouchableOpacity onPress={onShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={21} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="bookmark-outline" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={s.emptyWrap}>
      <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

function FeaturedCard({ article, onPress }: { article: BlogArticle; onPress: () => void }) {
  const readTime = `${article.read_minutes || 1} min read`;
  const date = new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const excerpt = article.excerpt || (article.body ? article.body.replace(/[#*_>`[\]!]/g, '').slice(0, 80) + '…' : '');
  return (
    <TouchableOpacity style={[fc.card, shadow.soft]} onPress={onPress} activeOpacity={0.88}>
      {article.cover ? (
        <Image source={{ uri: article.cover }} style={fc.thumb} resizeMode="cover" />
      ) : (
        <View style={[fc.thumb, fc.thumbPlaceholder]}>
          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
        </View>
      )}
      <View style={fc.body}>
        {article.category ? <Text style={fc.category}>{article.category}</Text> : null}
        <Text style={fc.title} numberOfLines={2}>{article.title}</Text>
        {excerpt ? <Text style={fc.excerpt} numberOfLines={2}>{excerpt}</Text> : null}
        <Text style={fc.meta}>{readTime} · {date}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PostCard({ article, onPress }: { article: BlogArticle; onPress: () => void }) {
  const [saved, setSaved] = useState(false);
  const readTime = `${article.read_minutes || 1} min read`;
  const date = new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <TouchableOpacity style={[pc.card, shadow.soft]} onPress={onPress} activeOpacity={0.88}>
      {article.cover ? (
        <Image source={{ uri: article.cover }} style={pc.thumb} resizeMode="cover" />
      ) : (
        <View style={[pc.thumb, pc.thumbPlaceholder]}>
          <Ionicons name="image-outline" size={18} color={colors.textMuted} />
        </View>
      )}
      <View style={pc.body}>
        {article.category ? <Text style={pc.category}>{article.category}</Text> : null}
        <Text style={pc.title} numberOfLines={2}>{article.title}</Text>
        <Text style={pc.meta}>{readTime} · {date}</Text>
        {article.views > 0 ? (
          <View style={pc.viewsRow}>
            <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
            <Text style={pc.viewsText}>{article.views.toLocaleString()} views</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity onPress={() => setSaved(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.primary : colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md },
  thumb: { width: 110, height: 100, backgroundColor: colors.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md, justifyContent: 'center', gap: 4 },
  category: { fontSize: 11, fontWeight: '700', color: colors.primary },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  excerpt: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

const pc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  category: { fontSize: 11, fontWeight: '700', color: colors.primary },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  meta: { fontSize: 11, color: colors.textMuted },
  viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewsText: { fontSize: 11, color: colors.textMuted },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm, fontSize: 15 },
  headerRight: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  draftBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, paddingVertical: 7,
  },
  draftText: { fontSize: 12, fontWeight: '700', color: colors.white },
  scroll: { paddingBottom: spacing.xxl },
  bannerWrap: { position: 'relative', marginBottom: 44 },
  banner: { width: '100%', height: 180, backgroundColor: colors.border },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F4' },
  avatarWrap: {
    position: 'absolute', bottom: -40, left: spacing.lg,
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: colors.background,
    overflow: 'hidden', backgroundColor: colors.border,
  },
  metaBlock: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  blogTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  blogDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.xs },
  byLine: { fontSize: 13, color: colors.textPrimary, marginBottom: spacing.sm },
  byAuthor: { fontWeight: '700', color: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  followBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  followBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  followingBtnText: { color: colors.primary },
  shareBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tabsRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: spacing.xs },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabSearch: { marginLeft: 'auto' as never, paddingVertical: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.lg, marginBottom: 0, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.textPrimary },
  section: { padding: spacing.lg, paddingTop: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  viewAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  aboutCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  aboutDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  aboutAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  aboutAuthorLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  aboutAuthorName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  aboutAuthorLink: { fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 2 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
