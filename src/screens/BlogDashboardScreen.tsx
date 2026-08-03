import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import StatusBadge from './earn/components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { blogs, blogPosts } from '../data/earnData';
import type { RootStackParamList } from '../navigation/types';
import { blogsService } from '../services/api/blogs.service';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogDashboard'>;

const DASHBOARD_TABS = ['Dashboard', 'Posts', 'Drafts', 'Scheduled', 'Comments', 'Followers', 'Analytics', 'Settings'];

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

const RECENT_ACTIVITY = [
  { id: 'act-1', text: 'New post published: "10 Morning Habits for a Healthy Life"', time: '10:24 AM' },
  { id: 'act-2', text: 'New follower: Sarah Johnson started following your blog', time: '09:45 AM' },
  { id: 'act-3', text: 'New comment on "How to Stay Motivated Every Day"', time: 'Yesterday, 08:30 PM' },
];

const QUICK_LINKS = [
  { key: 'blog-settings', label: 'Blog Settings', icon: 'settings-outline' },
  { key: 'monetization', label: 'Monetization Settings', icon: 'cash-outline' },
  { key: 'seo', label: 'SEO & Social Settings', icon: 'search-outline' },
  { key: 'domain', label: 'Custom Domain', icon: 'globe-outline' },
  { key: 'export', label: 'Export Blog Data', icon: 'cloud-download-outline' },
];

export default function BlogDashboardScreen({ route, navigation }: Props) {
  const { blogId } = route.params;
  const showcaseBlog = blogs.find((b) => b.id === blogId);
  const [blog,setBlog]=useState(showcaseBlog ?? {...blogs[0],id:blogId,name:'My Blog',description:'',category:'',url:'',cover:'',status:'Draft' as const,posts:0,views:0,earned:0,followers:0});
  const [posts,setPosts]=useState(showcaseBlog ? blogPosts.filter(p=>p.blogId===blogId) : []);
  const [tab, setTab] = useState(DASHBOARD_TABS[0]);
  useEffect(()=>{if(showcaseBlog)return;Promise.all([blogsService.sites(),blogsService.articles(blogId),blogsService.analytics(blogId)]).then(([sites,articles,analytics])=>{const site=sites.find(x=>x.id===blogId);if(!site)return;setBlog({...blog,id:site.id,name:site.name,url:`${site.slug}.teamcal.blog`,category:site.category||'',cover:site.cover||'',status:'Draft',posts:analytics.posts,views:analytics.views,earned:analytics.earned,followers:analytics.followers,updated:new Date(site.created_at).toLocaleDateString(),description:site.description||''});setPosts(articles.map(x=>({id:x.id,blogId:x.blog_id,title:x.title,status:(x.status.charAt(0).toUpperCase()+x.status.slice(1)) as 'Published'|'Draft'|'Scheduled',views:Number(x.views||0),readTime:`${x.read_minutes||1}m`,earned:Number(x.earned||0),date:new Date(x.created_at).toLocaleDateString(),thumbnail:x.cover||''})));}).catch(e=>Alert.alert('Unable to load blog',e.message));},[blogId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>
          {blog.name}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={DASHBOARD_TABS} value={tab} onChange={setTab} variant="pill" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: blog.cover }} style={styles.cover} />
        <View style={[styles.blogHeaderCard, shadow.card]}>
          <View style={styles.blogTopRow}>
            <Text style={styles.blogName}>{blog.name}</Text>
            <StatusBadge status={blog.status} />
          </View>
          <Text style={styles.blogDescription}>{blog.description}</Text>
          <View style={styles.blogMetaRow}>
            <Ionicons name="pricetag-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.blogMetaText}>{blog.category}</Text>
            <Ionicons name="people-outline" size={13} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
            <Text style={styles.blogMetaText}>{blog.followers.toLocaleString()} Followers</Text>
          </View>
          <Text style={styles.blogUrl}>{blog.url}</Text>
          <View style={styles.blogActionsRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => comingSoon('View blog')}>
              <Text style={styles.outlineBtnText}>View Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => Share.share({ message: `Check out my blog: ${blog.url}` })}>
              <Text style={styles.outlineBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => comingSoon('More options')}>
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'Dashboard' && (
          <>
            <TouchableOpacity style={styles.createCard} onPress={() => navigation.navigate('ArticleEditor',{blogId})} activeOpacity={0.9}>
              <View style={{ flex: 1 }}>
                <Text style={styles.createTitle}>Create New Post</Text>
                <Text style={styles.createSubtitle}>Write, record, or generate a post in minutes.</Text>
              </View>
              <View style={styles.createIcon}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Overview Stats</Text>
            <View style={styles.statsGrid}>
              <MiniStat label="Total Views" value={blog.views.toLocaleString()} />
              <MiniStat label="Visitors" value={Math.round(blog.views * 0.63).toLocaleString()} />
              <MiniStat label="Total Earnings" value={`$${blog.earned.toLocaleString()}`} />
              <MiniStat label="Followers" value={blog.followers.toLocaleString()} />
              <MiniStat label="Avg. Read Time" value="4m 38s" />
              <MiniStat label="Conversion Rate" value="2.6%" />
            </View>

            <Text style={styles.sectionTitle}>Top Performing Posts</Text>
            <View style={[styles.card, shadow.card]}>
              {posts.length === 0 && <Text style={styles.emptyText}>No posts yet for this blog.</Text>}
              {posts.map((post, i) => (
                <TouchableOpacity key={post.id} style={[styles.postRow, i === posts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => comingSoon('Post analytics')}>
                  <Image source={{ uri: post.thumbnail }} style={styles.postThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postTitle} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <Text style={styles.postMeta}>
                      {post.views.toLocaleString()} views · {post.readTime}
                    </Text>
                  </View>
                  <Text style={styles.postEarned}>${post.earned.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={[styles.card, shadow.card]}>
              {RECENT_ACTIVITY.map((activity, i) => (
                <View key={activity.id} style={[styles.activityRow, i === RECENT_ACTIVITY.length - 1 && { borderBottomWidth: 0 }]}>
                  <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={[styles.card, shadow.card]}>
              {QUICK_LINKS.map((link, i) => (
              <TouchableOpacity key={link.key} style={[styles.linkRow, i === QUICK_LINKS.length - 1 && { borderBottomWidth: 0 }]} onPress={() => link.key==='blog-settings'&&!showcaseBlog?navigation.navigate('BlogSettings',{blogId}):comingSoon(link.label)}>
                  <Ionicons name={link.icon as keyof typeof Ionicons.glyphMap} size={17} color={colors.primary} />
                  <Text style={styles.linkLabel}>{link.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Earnings Summary</Text>
            <View style={[styles.card, shadow.card, { marginBottom: spacing.xxl }]}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Total Earnings</Text>
                <Text style={styles.earningsValue}>${blog.earned.toLocaleString()}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>This Month</Text>
                <Text style={styles.earningsValueMuted}>${(blog.earned * 0.15).toFixed(2)}</Text>
              </View>
              <View style={[styles.earningsRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.earningsLabel}>Pending</Text>
                <Text style={styles.earningsValueMuted}>${(blog.earned * 0.02).toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        {tab === 'Posts' && (
          <View style={[styles.card, shadow.card, { marginTop: spacing.lg, marginBottom: spacing.xxl }]}>
            {posts.map((post, i) => (
              <TouchableOpacity key={post.id} style={[styles.postRow, i === posts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => showcaseBlog ? comingSoon('Showcase post editor') : navigation.navigate('ArticleEditor',{blogId,articleId:post.id})}>
                <Image source={{ uri: post.thumbnail }} style={styles.postThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={styles.postMeta}>{post.date}</Text>
                </View>
                <StatusBadge status={post.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab !== 'Dashboard' && tab !== 'Posts' && (
          <View style={[styles.card, shadow.card, styles.placeholderCard]}>
            <Ionicons name="construct-outline" size={28} color={colors.textMuted} />
            <Text style={styles.placeholderText}>{tab} is coming soon.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.miniStat, shadow.soft]}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  pageTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  tabsWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  cover: { width: '100%', height: 120, borderRadius: radii.xl, backgroundColor: colors.border },
  blogHeaderCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginTop: -30, marginHorizontal: spacing.sm },
  blogTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blogName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  blogDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 17 },
  blogMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  blogMetaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
  blogUrl: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 6 },
  blogActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  createTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  createSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, marginTop: 2 },
  createIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  miniStat: { width: '31.5%', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  miniStatValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  miniStatLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 3 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  postThumb: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.border },
  postTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  postMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  postEarned: { fontSize: 12.5, fontWeight: '800', color: colors.success },
  activityRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityText: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 18 },
  activityTime: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  earningsLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  earningsValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  earningsValueMuted: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  placeholderCard: { marginTop: spacing.lg, marginBottom: spacing.xxl, alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  placeholderText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
