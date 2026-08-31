import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS, ActivityIndicator, Alert, Image, Platform,
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { blogsService, type BlogArticle, type BlogSite } from '../services/api/blogs.service';
import { postsService } from '../services/api/posts.service';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogSettings'>;

const LAYOUTS: { key: BlogSite['layout']; label: string; icon: string }[] = [
  { key: 'grid', label: 'Grid', icon: 'grid-outline' },
  { key: 'list', label: 'List', icon: 'list-outline' },
  { key: 'featured', label: 'Featured', icon: 'star-outline' },
];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Arabic','Hindi','Chinese','Japanese','Korean'];
const POST_ORDERS = ['Newest first','Oldest first','Most viewed','Alphabetical'];
const ACCENT_COLORS = ['#FF5A1F','#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const SECTIONS = ['General','Branding','Featured Post','Content','Visibility','SEO','Notifications','Danger Zone'] as const;
type Section = typeof SECTIONS[number];

export default function BlogSettingsScreen({ route, navigation }: Props) {
  const { blogId } = route.params;
  const [site, setSite] = useState<BlogSite | null>(null);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('General');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [slug, setSlug] = useState('');
  const [language, setLanguage] = useState('English');
  const [bannerUri, setBannerUri] = useState('');
  const [accentColor, setAccentColor] = useState('#FF5A1F');
  const [layout, setLayout] = useState<BlogSite['layout']>('list');
  const [featuredId, setFeaturedId] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [postOrder, setPostOrder] = useState('Newest first');
  const [showReadTime, setShowReadTime] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentApproval, setCommentApproval] = useState(false);
  const [status, setStatus] = useState<'draft'|'public'|'private'>('draft');
  const [allowDiscovery, setAllowDiscovery] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [defaultShareMessage, setDefaultShareMessage] = useState('');
  const [notifyNewPost, setNotifyNewPost] = useState(true);
  const [notifyScheduled, setNotifyScheduled] = useState(false);
  const [notifyUpdated, setNotifyUpdated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rows, arts] = await Promise.all([blogsService.sites(), blogsService.articles(blogId)]);
        const s = rows.find(x => x.id === blogId);
        if (!s) throw new Error('Blog not found');
        setSite(s);
        setArticles(arts.filter(a => a.status === 'published'));
        setName(s.name || ''); setDescription(s.description || ''); setCategory(s.category || '');
        setSlug(s.slug || ''); setLanguage(s.language || 'English'); setBannerUri(s.cover || '');
        setAccentColor(s.accentColor || '#FF5A1F'); setLayout(s.layout || 'list');
        setFeaturedId(s.featuredArticleId || ''); setPostOrder(s.postOrder || 'Newest first');
        setShowReadTime(s.showReadTime !== false); setShowDates(s.showDates !== false);
        setCommentsEnabled(s.commentsEnabled !== false); setCommentApproval(!!s.commentApproval);
        setStatus((s.status as 'draft'|'public'|'private') || 'draft');
        setAllowDiscovery(s.allowDiscovery !== false); setSearchTitle(s.searchTitle || '');
        setSearchDescription(s.searchDescription || ''); setDefaultShareMessage(s.defaultShareMessage || '');
        setNotifyNewPost(s.notifyNewPost !== false); setNotifyScheduled(!!s.notifyScheduled);
        setNotifyUpdated(!!s.notifyUpdated);
      } catch (e) { Alert.alert('Error', (e as Error).message); }
      finally { setLoading(false); }
    })();
  }, [blogId]);

  const save = async () => {
    const trimmedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/(^-|-$)/g,'');
    if (!name.trim()) { Alert.alert('Blog name is required'); return; }
    if (trimmedSlug !== (site?.slug || '')) {
      const ok = await new Promise<boolean>(res =>
        Alert.alert('Change blog URL?','Previously shared links may stop working.',[
          {text:'Cancel',style:'cancel',onPress:()=>res(false)},
          {text:'Change',style:'destructive',onPress:()=>res(true)},
        ]));
      if (!ok) return;
    }
    setSaving(true);
    try {
      await blogsService.updateSite(blogId, {
        name:name.trim(), description:description.trim(), category:category.trim(),
        slug:trimmedSlug, language, cover:bannerUri||null, accentColor, layout,
        featuredArticleId:featuredId||null, postOrder, showReadTime, showDates,
        commentsEnabled, commentApproval, status, allowDiscovery,
        searchTitle:searchTitle.trim(), searchDescription:searchDescription.trim(),
        defaultShareMessage:defaultShareMessage.trim(),
        notifyNewPost, notifyScheduled, notifyUpdated,
      });
      Alert.alert('Saved','Blog settings updated.',[{text:'Done',onPress:()=>navigation.goBack()}]);
    } catch (e) { Alert.alert('Unable to save',(e as Error).message); }
    finally { setSaving(false); }
  };

  const pickBanner = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:0.7, allowsEditing:true, aspect:[16,5] });
    if (picked.canceled) return;
    setUploading(true);
    try {
      const a = picked.assets[0];
      setBannerUri(await postsService.uploadImage({uri:a.uri,mimeType:a.mimeType||'image/jpeg',fileName:a.fileName||'banner.jpg'}));
    } catch (e) { Alert.alert('Upload failed',(e as Error).message); }
    finally { setUploading(false); }
  };

  const showBannerActions = () => {
    const has = !!bannerUri;
    const opts = has ? ['Upload Photo','Replace Photo','Delete Photo','Cancel'] : ['Upload Photo','Cancel'];
    const cancel = opts.length - 1;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({options:opts,cancelButtonIndex:cancel,destructiveButtonIndex:has?2:undefined,title:'Blog Banner'}, idx => {
        if (idx===cancel) return;
        if (has && idx===2) { Alert.alert('Delete banner photo?','Are you sure you want to delete this banner photo?',[{text:'Cancel',style:'cancel'},{text:'Delete Photo',style:'destructive',onPress:()=>setBannerUri('')}]); return; }
        pickBanner();
      });
    } else {
      const btns: {text:string;style?:'cancel'|'destructive';onPress?:()=>void}[] = [{text:'Upload Photo',onPress:pickBanner}];
      if (has) btns.push({text:'Replace Photo',onPress:pickBanner},{text:'Delete Photo',style:'destructive',onPress:()=>Alert.alert('Delete banner photo?','Are you sure you want to delete this banner photo?',[{text:'Cancel',style:'cancel'},{text:'Delete Photo',style:'destructive',onPress:()=>setBannerUri('')}])});
      btns.push({text:'Cancel',style:'cancel'});
      Alert.alert('Blog Banner',undefined,btns);
    }
  };

  const deleteBlog = () => {
    if (confirmDelete !== name) { Alert.alert('Type the blog name exactly to confirm deletion.'); return; }
    Alert.alert('Delete this blog permanently?',`This will permanently delete "${name}" and all its posts, drafts, media, comments, followers, and analytics. This cannot be undone.`,[
      {text:'Cancel',style:'cancel'},
      {text:'Delete Blog Permanently',style:'destructive',onPress:async()=>{
        setSaving(true);
        try { await blogsService.deleteSite(blogId); navigation.goBack(); navigation.goBack(); Alert.alert('Blog deleted successfully.'); }
        catch(e){ Alert.alert('Error',(e as Error).message); }
        finally{ setSaving(false); }
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Hdr title="Blog Settings" onBack={()=>navigation.goBack()} />
      <ActivityIndicator color={colors.primary} style={{marginTop:60}} />
    </SafeAreaView>
  );

  const publishedArts = articles;
  const filteredArts = featuredSearch ? publishedArts.filter(a=>a.title.toLowerCase().includes(featuredSearch.toLowerCase())) : publishedArts;
  const featuredArt = publishedArts.find(a=>a.id===featuredId);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Hdr title="Blog Settings" onBack={()=>navigation.goBack()} onSave={activeSection!=='Danger Zone'?save:undefined} saving={saving} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.navRow}>
        {SECTIONS.map(sec=>(
          <TouchableOpacity key={sec} style={[s.pill, activeSection===sec&&s.pillActive, sec==='Danger Zone'&&s.pillDanger, activeSection===sec&&sec==='Danger Zone'&&s.pillDangerActive]} onPress={()=>setActiveSection(sec)} activeOpacity={0.8}>
            <Text style={[s.pillText, activeSection===sec&&s.pillTextActive, sec==='Danger Zone'&&s.pillTextDanger]}>{sec}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── GENERAL ── */}
        {activeSection==='General'&&<View style={s.section}>
          <SectionHdr title="General Information"/>
          <Field label="Blog Name" required><TextInput style={s.input} value={name} onChangeText={setName} placeholder="My Blog" placeholderTextColor={colors.textMuted}/></Field>
          <Field label="Blog Description"><TextInput style={[s.input,s.multiline]} value={description} onChangeText={setDescription} placeholder="Tell readers what your blog is about…" placeholderTextColor={colors.textMuted} multiline/></Field>
          <Field label="Category"><TextInput style={s.input} value={category} onChangeText={setCategory} placeholder="e.g. Health & Wellness" placeholderTextColor={colors.textMuted}/></Field>
          <Field label="Blog URL Slug" hint={`teamcal.blog/${slug||'your-slug'}`}><TextInput style={s.input} value={slug} onChangeText={setSlug} placeholder="my-blog" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false}/></Field>
          <Field label="Language"><Picker label={language} onPress={()=>showPicker('Language',LANGUAGES,language,setLanguage)}/></Field>
          <InfoCard text="Author name comes from your account profile. To update it, edit your main account profile."/>
        </View>}

        {/* ── BRANDING ── */}
        {activeSection==='Branding'&&<View style={s.section}>
          <SectionHdr title="Branding & Appearance"/>
          <Field label="Blog Banner">
            <TouchableOpacity style={s.bannerArea} onPress={showBannerActions} activeOpacity={0.85}>
              {uploading ? (
                <View style={[s.bannerPreview,s.bannerPlaceholder]}><ActivityIndicator color={colors.primary}/><Text style={s.bannerHint}>Uploading…</Text></View>
              ) : bannerUri ? (
                <View><Image source={{uri:bannerUri}} style={s.bannerPreview} resizeMode="cover"/>
                  <View style={s.bannerEditOverlay}><Ionicons name="camera" size={14} color={colors.white}/><Text style={s.bannerEditText}>Edit</Text></View>
                </View>
              ) : (
                <View style={[s.bannerPreview,s.bannerPlaceholder]}><Ionicons name="camera-outline" size={28} color={colors.textMuted}/><Text style={s.bannerHint}>Upload Banner Photo</Text></View>
              )}
            </TouchableOpacity>
          </Field>
          <Field label="Accent Color">
            <View style={s.colorGrid}>
              {ACCENT_COLORS.map(c=>(
                <TouchableOpacity key={c} style={[s.swatch,{backgroundColor:c},accentColor===c&&s.swatchActive]} onPress={()=>setAccentColor(c)} activeOpacity={0.8}>
                  {accentColor===c&&<Ionicons name="checkmark" size={14} color="#fff"/>}
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Field label="Post Layout">
            <View style={s.layoutRow}>
              {LAYOUTS.map(l=>(
                <TouchableOpacity key={l.key} style={[s.layoutBtn,layout===l.key&&s.layoutBtnActive]} onPress={()=>setLayout(l.key)} activeOpacity={0.8}>
                  <Ionicons name={l.icon as keyof typeof Ionicons.glyphMap} size={18} color={layout===l.key?colors.primary:colors.textMuted}/>
                  <Text style={[s.layoutLabel,layout===l.key&&s.layoutLabelActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>}

        {/* ── FEATURED POST ── */}
        {activeSection==='Featured Post'&&<View style={s.section}>
          <SectionHdr title="Featured Post" subtitle="Feature one published post prominently at the top of your blog."/>
          {featuredArt ? (
            <View style={[s.featuredCard,shadow.soft]}>
              {featuredArt.cover?<Image source={{uri:featuredArt.cover}} style={s.featuredThumb} resizeMode="cover"/>:<View style={[s.featuredThumb,s.featuredThumbPh]}><Ionicons name="image-outline" size={20} color={colors.textMuted}/></View>}
              <View style={{flex:1,padding:spacing.md}}>
                <Text style={s.featuredTitle} numberOfLines={2}>{featuredArt.title}</Text>
                <Text style={s.featuredMeta}>{featuredArt.read_minutes||1} min · {new Date(featuredArt.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={()=>setFeaturedId('')} hitSlop={{top:6,bottom:6,left:6,right:6}} style={{padding:spacing.md}}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted}/>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[s.featuredEmpty,shadow.soft]}>
              <Ionicons name="star-outline" size={28} color={colors.textMuted}/>
              <Text style={s.featuredEmptyText}>No featured post selected</Text>
            </View>
          )}
          <TextInput style={[s.input,{marginTop:spacing.lg}]} value={featuredSearch} onChangeText={setFeaturedSearch} placeholder="Search posts by title…" placeholderTextColor={colors.textMuted}/>
          {publishedArts.length===0 ? (
            <Text style={s.hint}>Publish a post first to feature it here.</Text>
          ) : filteredArts.map(a=>(
            <TouchableOpacity key={a.id} style={[s.pickRow,featuredId===a.id&&s.pickRowActive]} onPress={()=>setFeaturedId(a.id)} activeOpacity={0.85}>
              {a.cover?<Image source={{uri:a.cover}} style={s.pickThumb}/>:<View style={[s.pickThumb,s.pickThumbPh]}><Ionicons name="image-outline" size={14} color={colors.textMuted}/></View>}
              <Text style={s.pickTitle} numberOfLines={2}>{a.title}</Text>
              {featuredId===a.id&&<Ionicons name="checkmark-circle" size={20} color={colors.primary}/>}
            </TouchableOpacity>
          ))}
        </View>}

        {/* ── CONTENT ── */}
        {activeSection==='Content'&&<View style={s.section}>
          <SectionHdr title="Content Settings"/>
          <Field label="Post Order"><Picker label={postOrder} onPress={()=>showPicker('Post Order',POST_ORDERS,postOrder,setPostOrder)}/></Field>
          <Toggle label="Show estimated reading time" value={showReadTime} onChange={setShowReadTime}/>
          <Toggle label="Show publication dates" value={showDates} onChange={setShowDates}/>
          <Toggle label="Enable comments" value={commentsEnabled} onChange={setCommentsEnabled}/>
          {commentsEnabled&&<Toggle label="Require comment approval before publishing" value={commentApproval} onChange={setCommentApproval} indent/>}
        </View>}

        {/* ── VISIBILITY ── */}
        {activeSection==='Visibility'&&<View style={s.section}>
          <SectionHdr title="Visibility & Publishing"/>
          <Field label="Blog Status">
            <View style={s.statusRow}>
              {(['draft','public','private'] as const).map(opt=>(
                <TouchableOpacity key={opt} style={[s.statusBtn,status===opt&&s.statusBtnActive]} onPress={()=>setStatus(opt)} activeOpacity={0.8}>
                  <Text style={[s.statusBtnText,status===opt&&s.statusBtnTextActive]}>{opt.charAt(0).toUpperCase()+opt.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Toggle label="Allow blog to appear in platform search and discovery" value={allowDiscovery} onChange={setAllowDiscovery}/>
          <InfoCard text="You can always preview your blog before publishing it by tapping View Blog from the dashboard."/>
        </View>}

        {/* ── SEO ── */}
        {activeSection==='SEO'&&<View style={s.section}>
          <SectionHdr title="Sharing & SEO"/>
          <Field label="Search Title" hint="How your blog appears in search results"><TextInput style={s.input} value={searchTitle} onChangeText={setSearchTitle} placeholder={name} placeholderTextColor={colors.textMuted}/></Field>
          <Field label="Search Description" hint="A short summary for search engines and social previews"><TextInput style={[s.input,s.multiline]} value={searchDescription} onChangeText={setSearchDescription} placeholder={description} placeholderTextColor={colors.textMuted} multiline/></Field>
          <Field label="Default Share Message"><TextInput style={s.input} value={defaultShareMessage} onChangeText={setDefaultShareMessage} placeholder="Check out this post from my blog!" placeholderTextColor={colors.textMuted}/></Field>
          <Field label="Public Blog Link">
            <View style={s.linkRow}>
              <Text style={s.linkText} numberOfLines={1}>{`https://${slug||site?.slug}.teamcal.blog`}</Text>
              <Ionicons name="copy-outline" size={18} color={colors.primary}/>
            </View>
          </Field>
        </View>}

        {/* ── NOTIFICATIONS ── */}
        {activeSection==='Notifications'&&<View style={s.section}>
          <SectionHdr title="Notifications" subtitle="Notify followers when:"/>
          <Toggle label="A new post is published" value={notifyNewPost} onChange={setNotifyNewPost}/>
          <Toggle label="A scheduled post becomes available" value={notifyScheduled} onChange={setNotifyScheduled}/>
          <Toggle label="An existing post is updated" value={notifyUpdated} onChange={setNotifyUpdated}/>
        </View>}

        {/* ── DANGER ZONE ── */}
        {activeSection==='Danger Zone'&&<View style={s.section}>
          <SectionHdr title="Danger Zone"/>
          <View style={[s.dangerCard,shadow.soft]}>
            <Text style={s.dangerTitle}>Delete this blog permanently</Text>
            <Text style={s.dangerDesc}>
              This will permanently delete <Text style={{fontWeight:'700'}}>{name}</Text> and may also delete all posts, drafts, media, comments, followers, and analytics. This action cannot be undone.
            </Text>
            <Text style={s.dangerConfirmLabel}>Type the blog name to confirm:</Text>
            <TextInput style={[s.input,{marginBottom:spacing.lg}]} value={confirmDelete} onChangeText={setConfirmDelete} placeholder={name} placeholderTextColor={colors.textMuted}/>
            <TouchableOpacity style={[s.deleteBtn,confirmDelete!==name&&{opacity:0.45}]} onPress={deleteBlog} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color="#fff"/>
              <Text style={s.deleteBtnText}>Delete Blog Permanently</Text>
            </TouchableOpacity>
          </View>
        </View>}

        <View style={{height:60}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function showPicker(title:string,options:string[],current:string,onSelect:(v:string)=>void){
  if(Platform.OS==='ios'){
    const all=[...options,'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions({options:all,cancelButtonIndex:all.length-1,title},idx=>{if(idx<options.length)onSelect(options[idx]);});
  }else{
    Alert.alert(title,undefined,[...options.map(o=>({text:o,onPress:()=>onSelect(o)})),{text:'Cancel',style:'cancel' as const}]);
  }
}

function Hdr({title,onBack,onSave,saving}:{title:string;onBack:()=>void;onSave?:()=>void;saving?:boolean}){
  return(
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{top:8,bottom:8,left:8,right:8}}><Ionicons name="chevron-back" size={22} color={colors.textPrimary}/></TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
      {onSave?<TouchableOpacity onPress={onSave} disabled={saving} hitSlop={{top:8,bottom:8,left:8,right:8}}><Text style={[s.saveBtn,saving&&{opacity:0.5}]}>{saving?'Saving…':'Save'}</Text></TouchableOpacity>:<View style={{width:40}}/>}
    </View>
  );
}
function SectionHdr({title,subtitle}:{title:string;subtitle?:string}){
  return <View style={s.sectionHdr}><Text style={s.sectionHdrTitle}>{title}</Text>{subtitle?<Text style={s.sectionHdrSub}>{subtitle}</Text>:null}</View>;
}
function Field({label,required,hint,children}:{label:string;required?:boolean;hint?:string;children:React.ReactNode}){
  return(
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}{required?<Text style={{color:'#EF4444'}}> *</Text>:''}</Text>
      {children}
      {hint?<Text style={s.fieldHint}>{hint}</Text>:null}
    </View>
  );
}
function Picker({label,onPress}:{label:string;onPress:()=>void}){
  return(
    <TouchableOpacity style={s.picker} onPress={onPress}>
      <Text style={s.pickerValue}>{label}</Text>
      <Ionicons name="chevron-down" size={15} color={colors.textMuted}/>
    </TouchableOpacity>
  );
}
function Toggle({label,value,onChange,indent}:{label:string;value:boolean;onChange:(v:boolean)=>void;indent?:boolean}){
  return(
    <View style={[s.toggle,indent&&{paddingLeft:spacing.xl}]}>
      <Text style={[s.toggleLabel,indent&&{fontSize:13}]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{true:colors.primary}} thumbColor="#fff"/>
    </View>
  );
}
function InfoCard({text}:{text:string}){
  return(
    <View style={[s.infoCard,shadow.soft]}>
      <Ionicons name="information-circle-outline" size={15} color={colors.primary}/>
      <Text style={s.infoText}>{text}</Text>
    </View>
  );
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.lg,paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  headerTitle:{...typography.h2,fontSize:16,color:colors.textPrimary},
  saveBtn:{fontSize:14,fontWeight:'700',color:colors.primary},
  navRow:{paddingHorizontal:spacing.lg,paddingVertical:spacing.md,gap:spacing.sm},
  pill:{paddingHorizontal:spacing.md,paddingVertical:6,borderRadius:radii.pill,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border},
  pillActive:{backgroundColor:colors.primary,borderColor:colors.primary},
  pillDanger:{borderColor:'#EF4444'},
  pillDangerActive:{backgroundColor:'#EF4444',borderColor:'#EF4444'},
  pillText:{fontSize:13,fontWeight:'600',color:colors.textSecondary},
  pillTextActive:{color:colors.white},
  pillTextDanger:{color:'#EF4444'},
  scroll:{padding:spacing.lg,paddingTop:0},
  section:{},
  sectionHdr:{marginTop:spacing.lg,marginBottom:spacing.md},
  sectionHdrTitle:{fontSize:16,fontWeight:'800',color:colors.textPrimary},
  sectionHdrSub:{fontSize:12.5,color:colors.textSecondary,marginTop:3},
  field:{marginBottom:spacing.lg},
  fieldLabel:{fontSize:13,fontWeight:'700',color:colors.textPrimary,marginBottom:spacing.sm},
  fieldHint:{fontSize:11.5,color:colors.textMuted,marginTop:5},
  input:{backgroundColor:colors.card,borderRadius:radii.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.md,fontSize:14,color:colors.textPrimary,borderWidth:1,borderColor:colors.border},
  multiline:{height:90,textAlignVertical:'top'},
  picker:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.card,borderRadius:radii.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.md,borderWidth:1,borderColor:colors.border},
  pickerValue:{fontSize:14,color:colors.textPrimary},
  toggle:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  toggleLabel:{fontSize:14,color:colors.textPrimary,flex:1,marginRight:spacing.md,lineHeight:20},
  infoCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,backgroundColor:`${colors.primary}0F`,borderRadius:radii.lg,padding:spacing.md,marginTop:spacing.md},
  infoText:{flex:1,fontSize:12.5,color:colors.textSecondary,lineHeight:18},
  bannerArea:{borderRadius:radii.lg,overflow:'hidden'},
  bannerPreview:{width:'100%',height:110,borderRadius:radii.lg,backgroundColor:colors.border},
  bannerPlaceholder:{alignItems:'center',justifyContent:'center',gap:6},
  bannerHint:{fontSize:12,color:colors.textMuted,fontWeight:'600'},
  bannerEditOverlay:{position:'absolute',top:8,right:8,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(0,0,0,0.55)',borderRadius:radii.pill,paddingHorizontal:10,paddingVertical:4},
  bannerEditText:{fontSize:12,color:'#fff',fontWeight:'600'},
  colorGrid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},
  swatch:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center'},
  swatchActive:{borderWidth:3,borderColor:colors.background},
  layoutRow:{flexDirection:'row',gap:spacing.sm},
  layoutBtn:{flex:1,alignItems:'center',justifyContent:'center',gap:4,paddingVertical:spacing.md,borderRadius:radii.lg,backgroundColor:colors.card,borderWidth:1.5,borderColor:colors.border},
  layoutBtnActive:{borderColor:colors.primary,backgroundColor:`${colors.primary}10`},
  layoutLabel:{fontSize:12,fontWeight:'600',color:colors.textSecondary},
  layoutLabelActive:{color:colors.primary},
  featuredCard:{flexDirection:'row',alignItems:'center',backgroundColor:colors.card,borderRadius:radii.xl,overflow:'hidden',borderWidth:1.5,borderColor:colors.primary},
  featuredThumb:{width:80,height:70,backgroundColor:colors.border},
  featuredThumbPh:{alignItems:'center',justifyContent:'center'},
  featuredTitle:{fontSize:13,fontWeight:'700',color:colors.textPrimary,lineHeight:18},
  featuredMeta:{fontSize:11,color:colors.textMuted,marginTop:3},
  featuredEmpty:{alignItems:'center',justifyContent:'center',gap:spacing.sm,backgroundColor:colors.card,borderRadius:radii.xl,paddingVertical:spacing.xl},
  featuredEmptyText:{fontSize:13,color:colors.textMuted,fontWeight:'600'},
  hint:{fontSize:12.5,color:colors.textMuted,textAlign:'center',paddingVertical:spacing.lg},
  pickRow:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  pickRowActive:{backgroundColor:`${colors.primary}08`,borderRadius:radii.md,paddingHorizontal:spacing.sm},
  pickThumb:{width:44,height:44,borderRadius:radii.md,backgroundColor:colors.border},
  pickThumbPh:{alignItems:'center',justifyContent:'center'},
  pickTitle:{flex:1,fontSize:13,fontWeight:'600',color:colors.textPrimary,lineHeight:18},
  statusRow:{flexDirection:'row',gap:spacing.sm},
  statusBtn:{flex:1,alignItems:'center',paddingVertical:spacing.md,borderRadius:radii.lg,backgroundColor:colors.card,borderWidth:1.5,borderColor:colors.border},
  statusBtnActive:{borderColor:colors.primary,backgroundColor:`${colors.primary}10`},
  statusBtnText:{fontSize:13,fontWeight:'600',color:colors.textSecondary},
  statusBtnTextActive:{color:colors.primary},
  linkRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.card,borderRadius:radii.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.md,borderWidth:1,borderColor:colors.border},
  linkText:{flex:1,fontSize:13,color:colors.primary,fontWeight:'600',marginRight:spacing.sm},
  dangerCard:{backgroundColor:colors.card,borderRadius:radii.xl,padding:spacing.lg,borderWidth:1.5,borderColor:'#EF4444',marginTop:spacing.lg},
  dangerTitle:{fontSize:15,fontWeight:'800',color:'#EF4444',marginBottom:spacing.sm},
  dangerDesc:{fontSize:13.5,color:colors.textSecondary,lineHeight:20,marginBottom:spacing.lg},
  dangerConfirmLabel:{fontSize:13,fontWeight:'700',color:colors.textPrimary,marginBottom:spacing.sm},
  deleteBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,backgroundColor:'#EF4444',borderRadius:radii.pill,paddingVertical:spacing.md,paddingHorizontal:spacing.lg},
  deleteBtnText:{fontSize:14,fontWeight:'700',color:'#fff'},
});
