import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SegmentedControl from '../components/SegmentedControl';
import StatusBadge from './earn/components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { blogsService } from '../services/api/blogs.service';
import { postsService } from '../services/api/posts.service';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogDashboard'>;

const DASHBOARD_TABS = ['Dashboard', 'Posts'];

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

type BlogView={id:string;name:string;description:string;category:string;url:string;cover:string;status:string;posts:number;views:number;earned:number;followers:number;updated:string};
type PostView={id:string;blogId:string;title:string;status:string;views:number;readTime:string;earned:number;date:string;thumbnail:string};

const QUICK_LINKS = [
  { key: 'blog-settings', label: 'Blog Settings', icon: 'settings-outline' },
];

export default function BlogDashboardScreen({ route, navigation }: Props) {
  const { blogId } = route.params;
  const [blog,setBlog]=useState<BlogView>({id:blogId,name:'',description:'',category:'',url:'',cover:'',status:'Draft',posts:0,views:0,earned:0,followers:0,updated:''});
  const [posts,setPosts]=useState<PostView[]>([]);
  const [tab, setTab] = useState(DASHBOARD_TABS[0]);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(()=>{const load=()=>Promise.all([blogsService.sites(),blogsService.articles(blogId),blogsService.analytics(blogId)]).then(([sites,articles,analytics])=>{const site=sites.find(x=>x.id===blogId);if(!site)throw new Error('Blog not found');setBlog({id:site.id,name:site.name,url:`${site.slug}.teamcal.blog`,category:site.category||'',cover:site.cover||'',status:site.status||'Draft',posts:analytics.posts,views:analytics.views,earned:analytics.earned,followers:analytics.followers,updated:new Date(site.created_at).toLocaleDateString(),description:site.description||''});setPosts(articles.map(x=>({id:x.id,blogId:x.blog_id,title:x.title,status:x.status.charAt(0).toUpperCase()+x.status.slice(1),views:Number(x.views||0),readTime:`${x.read_minutes||1}m`,earned:Number(x.earned||0),date:new Date(x.created_at).toLocaleDateString(),thumbnail:x.cover||''})));}).catch(e=>Alert.alert('Unable to load blog',e.message));load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[blogId]);

  const pickAndUploadBanner = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [16, 5] });
    if (picked.canceled) return;
    setUploadingBanner(true);
    try {
      const asset = picked.assets[0];
      const url = await postsService.uploadImage({ uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', fileName: asset.fileName || 'banner.jpg' });
      await blogsService.updateSite(blogId, { cover: url });
      setBlog(b => ({ ...b, cover: url }));
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const openPost = (post: PostView) => {
    if (post.status === 'Draft') navigation.navigate('ArticleEditor', { blogId, articleId: post.id });
    else navigation.navigate('ArticleDetail', { articleId: post.id, blogId, isOwner: true });
  };

  const deleteBanner = () =>
    Alert.alert('Delete banner photo?', 'Are you sure you want to delete this banner photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Photo', style: 'destructive', onPress: async () => {
        try { await blogsService.updateSite(blogId, { cover: null }); setBlog(b => ({ ...b, cover: '' })); }
        catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);

  const showBannerOptions = () => {
    const hasBanner = !!blog.cover;
    if (Platform.OS === 'ios') {
      const options = hasBanner ? ['Upload Photo', 'Replace Photo', 'Reposition Photo', 'Delete Photo', 'Cancel'] : ['Upload Photo', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: hasBanner ? 3 : undefined, title: 'Blog Banner' }, idx => {
        if (idx === options.length - 1) return;
        if (hasBanner && idx === 3) { deleteBanner(); return; }
        pickAndUploadBanner();
      });
    } else {
      const btns: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [{ text: 'Upload Photo', onPress: pickAndUploadBanner }];
      if (hasBanner) btns.push({ text: 'Replace Photo', onPress: pickAndUploadBanner }, { text: 'Delete Photo', style: 'destructive', onPress: deleteBanner });
      btns.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Blog Banner', undefined, btns);
    }
  };

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
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {blog.cover ? (
            <Image source={{ uri: blog.cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <TouchableOpacity style={[styles.cover, styles.coverPlaceholder]} onPress={showBannerOptions} activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
              <Text style={styles.uploadBannerText}>Upload Banner Photo</Text>
            </TouchableOpacity>
          )}
          {uploadingBanner ? (
            <View style={styles.bannerBusyOverlay}><Text style={styles.bannerBusyText}>Uploading…</Text></View>
          ) : blog.cover ? (
            <TouchableOpacity style={styles.bannerEditBtn} onPress={showBannerOptions} activeOpacity={0.85}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </TouchableOpacity>
          ) : null}
        </View>
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
            <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('BlogPublic',{blogId,isOwner:true})}>
              <Text style={styles.outlineBtnText}>View Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => Share.share({ message: `Check out my blog: ${blog.url}` })}>
              <Text style={styles.outlineBtnText}>Share</Text>
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
              <MiniStat label="Total Earnings" value={`$${blog.earned.toLocaleString()}`} />
              <MiniStat label="Followers" value={blog.followers.toLocaleString()} />
            </View>

            <Text style={styles.sectionTitle}>Top Performing Posts</Text>
            <View style={[styles.card, shadow.card]}>
              {posts.length === 0 && <Text style={styles.emptyText}>No posts yet for this blog.</Text>}
              {posts.map((post, i) => (
                <TouchableOpacity key={post.id} style={[styles.postRow, i === posts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openPost(post)}>
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
              {posts.slice(0,3).map((post, i) => (
                <View key={post.id} style={[styles.activityRow, i === Math.min(posts.length,3) - 1 && { borderBottomWidth: 0 }]}>
                  <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>{post.title}</Text>
                    <Text style={styles.activityTime}>{post.date}</Text>
                  </View>
                </View>
              ))}
              {!posts.length?<Text style={styles.activityTime}>No recent activity.</Text>:null}
            </View>

            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={[styles.card, shadow.card]}>
              {QUICK_LINKS.map((link, i) => (
              <TouchableOpacity key={link.key} style={[styles.linkRow, i === QUICK_LINKS.length - 1 && { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('BlogSettings',{blogId})}>
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
            </View>
          </>
        )}

        {tab === 'Posts' && (
          <View style={[styles.card, shadow.card, { marginTop: spacing.lg, marginBottom: spacing.xxl }]}>
            {posts.map((post, i) => (
              <TouchableOpacity key={post.id} style={[styles.postRow, i === posts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openPost(post)}>
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
  bannerContainer: { position: 'relative' },
  cover: { width: '100%', height: 130, borderRadius: radii.xl, backgroundColor: colors.border },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F4', gap: 6 },
  uploadBannerText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  bannerEditBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  bannerBusyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radii.xl, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  bannerBusyText: { color: colors.white, fontSize: 12, fontWeight: '700' },
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
