import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import SortDropdown from './components/SortDropdown';
import StatusBadge from './components/StatusBadge';
import MiniLineChart from '../../components/charts/MiniLineChart';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { blogs, blogPosts, blogPerformanceTrend, type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { blogsService, type BlogSite } from '../../services/api/blogs.service';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Earning', 'Most Viewed', 'Most Followers'];

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function BlogsTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [userBlogs,setUserBlogs]=useState<BlogSite[]>([]);
  const [loadError,setLoadError]=useState('');
  useFocusEffect(useCallback(()=>{let active=true;blogsService.sites().then(data=>{if(active){setUserBlogs(data);setLoadError('');}}).catch(e=>active&&setLoadError((e as Error).message));return()=>{active=false};},[]));

  const totals = useMemo(
    () => ({
      blogCount: blogs.length,
      posts: blogs.reduce((s, b) => s + b.posts, 0),
      views: blogs.reduce((s, b) => s + b.views, 0),
      earnings: blogs.reduce((s, b) => s + b.earned, 0),
      followers: blogs.reduce((s, b) => s + b.followers, 0),
    }),
    []
  );

  const sortedBlogs = useMemo(() => {
    const copy = [...blogs];
    if (sort === 'Oldest') return copy.reverse();
    if (sort === 'Highest Earning') return copy.sort((a, b) => b.earned - a.earned);
    if (sort === 'Most Viewed') return copy.sort((a, b) => b.views - a.views);
    if (sort === 'Most Followers') return copy.sort((a, b) => b.followers - a.followers);
    return copy;
  }, [sort]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Earn with Blogs</Text>
          <Text style={styles.subtitle}>Create your own hosted blog, publish valuable content, grow an audience and earn from your readers.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.audienceEngineBtn} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: 'Blogs' })} activeOpacity={0.85}>
        <Ionicons name="people-circle-outline" size={16} color={colors.white} />
        <Text style={styles.audienceEngineBtnText}>Audience Engine</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <StatCard label="My Blogs" value={String(userBlogs.length)} icon="albums-outline" />
        <StatCard label="Published Posts" value={String(totals.posts)} icon="document-text-outline" />
        <StatCard label="Total Views" value={totals.views.toLocaleString()} icon="eye-outline" />
        <StatCard label="Total Earnings" value={`$${totals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" />
        <StatCard label="Total Followers" value={totals.followers.toLocaleString()} icon="people-outline" />
        <StatCard label="Avg. Reading Time" value="4m 38s" icon="time-outline" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <TouchableOpacity style={styles.createCard} onPress={() => navigation.navigate('CreateBlog')} activeOpacity={0.9}>
        <View style={{ flex: 1 }}>
          <Text style={styles.createTitle}>Create a New Blog</Text>
          <Text style={styles.createSubtitle}>Set up a new blog in minutes and start publishing.</Text>
        </View>
        <View style={styles.createIcon}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your Blogs</Text>
        <View style={styles.sortRow}>
          <SortDropdown options={SORT_OPTIONS} value={sort} onChange={setSort} />
          <TouchableOpacity style={styles.filterBtn} onPress={() => comingSoon('Advanced filters')}>
            <Ionicons name="options-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        {loadError?<Text style={styles.blogUrl}>Could not load your blogs: {loadError}</Text>:null}
        {userBlogs.map(blog=><TouchableOpacity key={blog.id} style={[styles.blogCard,shadow.soft]} activeOpacity={0.85} onPress={()=>navigation.navigate('BlogDashboard',{blogId:blog.id})}><Image source={{uri:blog.cover||`https://picsum.photos/seed/${blog.id}/500/280`}} style={styles.blogCover}/><View style={styles.blogInfo}><View style={styles.blogTopRow}><Text style={styles.blogName} numberOfLines={1}>{blog.name}</Text><StatusBadge status={blog.status||'draft'}/></View><Text style={styles.blogUrl} numberOfLines={1}>{blog.slug}.teamcal.blog</Text><View style={styles.categoryPill}><Text style={styles.categoryPillText}>{blog.category||'General'}</Text></View><View style={styles.blogStatsRow}><Text style={styles.blogStat}>Saved to your account</Text></View></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted}/></TouchableOpacity>)}
        {!loadError&&!userBlogs.length?<Text style={styles.blogUrl}>No personal blogs yet. Create one above.</Text>:null}
      </View>

      <Text style={styles.sectionTitle}>Showcase Blogs</Text>
      <View style={{ gap: spacing.md }}>
        {sortedBlogs.map((blog) => (
          <TouchableOpacity key={blog.id} style={[styles.blogCard, shadow.soft]} activeOpacity={0.85} onPress={() => Alert.alert('Showcase blog','This example demonstrates how your own saved blog will appear.')}>
            <Image source={{ uri: blog.cover }} style={styles.blogCover} />
            <View style={styles.blogInfo}>
              <View style={styles.blogTopRow}>
                <Text style={styles.blogName} numberOfLines={1}>
                  {blog.name}
                </Text>
                <StatusBadge status={blog.status} />
              </View>
              <Text style={styles.blogUrl} numberOfLines={1}>
                {blog.url}
              </Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{blog.category}</Text>
              </View>
              <View style={styles.blogStatsRow}>
                <Text style={styles.blogStat}>{blog.posts} Posts</Text>
                <Text style={styles.blogStat}>{blog.views.toLocaleString()} Views</Text>
                <Text style={styles.blogStat}>${blog.earned.toLocaleString()} Earned</Text>
                <Text style={styles.blogStat}>{blog.followers.toLocaleString()} Followers</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.seeAllBtn} onPress={() => comingSoon('More blogs')}>
        <Text style={styles.seeAllText}>See All Blogs</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Blog Performance Overview</Text>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.perfRow}>
          <View style={styles.perfCol}>
            <Text style={styles.perfLabel}>Views</Text>
            <MiniLineChart values={blogPerformanceTrend.views} labels={blogPerformanceTrend.labels} width={250} height={70} />
          </View>
        </View>
        <TouchableOpacity onPress={() => comingSoon('Full analytics')}>
          <Text style={[styles.seeAllText, { textAlign: 'center', marginTop: spacing.sm }]}>View all analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActionsGrid}>
        {[
          { label: 'Create Post', icon: 'create-outline' },
          { label: 'Manage Posts', icon: 'list-outline' },
          { label: 'Blog Settings', icon: 'settings-outline' },
          { label: 'View Blog', icon: 'globe-outline' },
          { label: 'Promote Blog', icon: 'megaphone-outline' },
          { label: 'Copy Blog Link', icon: 'link-outline' },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickActionItem} onPress={() => comingSoon(action.label)}>
            <View style={styles.quickActionIcon}>
              <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Blog Posts</Text>
        <TouchableOpacity onPress={() => comingSoon('All posts')}>
          <Text style={styles.seeAllText}>See all posts</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, shadow.card, { marginBottom: spacing.xxl }]}>
        {blogPosts.map((post, i) => (
          <TouchableOpacity key={post.id} style={[styles.postRow, i === blogPosts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => comingSoon('Post editor')}>
            <Image source={{ uri: post.thumbnail }} style={styles.postThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle} numberOfLines={1}>
                {post.title}
              </Text>
              <Text style={styles.postMeta}>
                {post.views.toLocaleString()} views · {post.readTime}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.postEarned}>${post.earned.toFixed(2)}</Text>
              <StatusBadge status={post.status} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  audienceEngineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  audienceEngineBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  createTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  createSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11.5,
    marginTop: 2,
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  blogCover: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  blogInfo: {
    flex: 1,
  },
  blogTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  blogName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  blogUrl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAE6FF',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C5CFC',
  },
  blogStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  blogStat: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  seeAllBtn: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  perfRow: {
    alignItems: 'center',
  },
  perfCol: {
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionItem: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  postTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postEarned: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 4,
  },
});
