import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { blogCreateTypes, blogCategories, blogThemeColors } from '../data/earnData';
import type { RootStackParamList } from '../navigation/types';
import { blogsService } from '../services/api/blogs.service';
import { postsService } from '../services/api/posts.service';
import * as ImagePicker from 'expo-image-picker';

const STEP_COUNT = 7;

export default function CreateBlogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(1);
  const [blogType, setBlogType] = useState(blogCreateTypes[0].key);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState(blogCategories[0]);
  const [subdomain, setSubdomain] = useState('');
  const [themeColor, setThemeColor] = useState(blogThemeColors[0]);
  const [allowFollow, setAllowFollow] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [publicDiscoverable, setPublicDiscoverable] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdBlogId, setCreatedBlogId] = useState('');
  const [logo,setLogo]=useState('');const [cover,setCover]=useState('');
  const chooseImage=async(kind:'logo'|'cover')=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.5,allowsEditing:true,aspect:kind==='logo'?[1,1]:[16,9]});if(result.canceled)return;setCreating(true);try{const asset=result.assets[0];const url=await postsService.uploadImage({uri:asset.uri,mimeType:asset.mimeType||'image/jpeg',fileName:asset.fileName||`${kind}.jpg`});if(kind==='logo')setLogo(url);else setCover(url);}catch(e){Alert.alert('Upload failed',(e as Error).message)}finally{setCreating(false)}};

  const suggestedSubdomain = useMemo(
    () => (subdomain || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-blog',
    [subdomain, name]
  );

  const goBack = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const goNext = async () => {
    if (step === 2 && !name.trim()) return Alert.alert('Blog name required');
    if (step === STEP_COUNT - 1) {
      setCreating(true);
      try {
        const site = await blogsService.createSite({ name: name.trim(), slug: suggestedSubdomain, category, description: tagline.trim(), theme: themeColor,logo:logo||undefined,cover:cover||undefined, aiPrefs: JSON.stringify({ blogType, allowFollow, allowComments, publicDiscoverable }) });
        setCreatedBlogId(site.id);
        setStep(STEP_COUNT);
      } catch (error) { Alert.alert('Unable to create blog', (error as Error).message); }
      finally { setCreating(false); }
      return;
    }
    setStep((s) => Math.min(STEP_COUNT, s + 1));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Blog</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <View key={i} style={[styles.progressDot, i < step && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Choose the type of blog you want to create</Text>
            {blogCreateTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.optionCard, blogType === type.key && styles.optionCardActive]}
                onPress={() => setBlogType(type.key)}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{type.label}</Text>
                  <Text style={styles.optionDescription}>{type.description}</Text>
                </View>
                {blogType === type.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Let's start with the basics</Text>
            <Field label="Blog Name">
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Wellness Daily" placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="Tagline (optional)">
              <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholder="Tips, guides and inspiration for a healthier, happier you." placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {blogCategories.map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Choose your subdomain</Text>
            <Text style={styles.stepSubtitle}>This will be your blog's unique address on TeamCal.</Text>
            <View style={styles.subdomainRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={subdomain}
                onChangeText={setSubdomain}
                placeholder={suggestedSubdomain}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <Text style={styles.subdomainSuffix}>.teamcal.blog</Text>
            </View>
            <View style={styles.availabilityRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.availabilityText}>{suggestedSubdomain}.teamcal.blog is available</Text>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Upload logo & cover</Text>
            <Text style={styles.stepSubtitle}>Add a logo and cover image for your blog.</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => chooseImage('logo')}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Blog Logo · Tap to upload</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadBox, { height: 100 }]} onPress={() => chooseImage('cover')}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Blog Cover Image · Tap to upload</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.stepTitle}>Customize your appearance</Text>
            <Field label="Primary Color">
              <View style={styles.colorRow}>
                {blogThemeColors.map((c) => (
                  <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: c }, themeColor === c && styles.colorSwatchActive]} onPress={() => setThemeColor(c)} />
                ))}
              </View>
            </Field>
            <Field label="Allow readers to follow">
              <Switch value={allowFollow} onValueChange={setAllowFollow} trackColor={{ true: colors.primary }} />
            </Field>
            <Field label="Allow comments on posts">
              <Switch value={allowComments} onValueChange={setAllowComments} trackColor={{ true: colors.primary }} />
            </Field>
            <Field label="Make blog publicly discoverable">
              <Switch value={publicDiscoverable} onValueChange={setPublicDiscoverable} trackColor={{ true: colors.primary }} />
            </Field>
          </>
        )}

        {step === 6 && (
          <>
            <Text style={styles.stepTitle}>Review your blog</Text>
            <Text style={styles.stepSubtitle}>Please review your details before creating your blog.</Text>
            <View style={[styles.reviewCard, shadow.card]}>
              <ReviewRow label="Name" value={name || 'Untitled Blog'} />
              <ReviewRow label="Tagline" value={tagline || '—'} />
              <ReviewRow label="Category" value={category} />
              <ReviewRow label="URL" value={`${suggestedSubdomain}.teamcal.blog`} />
              <ReviewRow label="Visibility" value={publicDiscoverable ? 'Public' : 'Private'} last />
            </View>
          </>
        )}

        {step === 7 && (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={36} color={colors.white} />
            </View>
            <Text style={styles.successTitle}>Blog Created Successfully!</Text>
            <Text style={styles.successSubtitle}>
              {name || 'Your blog'} is now live on TeamCal at {suggestedSubdomain}.teamcal.blog
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === 7 ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('ArticleEditor', { blogId: createdBlogId })} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Create New Blog Post</Text>
            </TouchableOpacity>
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.replace('BlogDashboard', { blogId: createdBlogId })} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Go to Blog Dashboard</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85} disabled={creating}>
            <Text style={styles.primaryBtnText}>{creating ? 'Creating your blog…' : step === STEP_COUNT - 1 ? 'Create Blog' : 'Continue'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.reviewRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  stepTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  stepSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.lg },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionDescription: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  field: { marginTop: spacing.lg },
  fieldLabelRow: {},
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  subdomainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subdomainSuffix: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  availabilityText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  uploadBox: {
    height: 130,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  uploadPreview: { width: '100%', height: '100%', borderRadius: radii.xl },
  uploadText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: spacing.sm },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  colorSwatchActive: { borderWidth: 3, borderColor: colors.navy },
  reviewCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  reviewLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  reviewValue: { fontSize: 12.5, color: colors.textPrimary, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  successWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 19 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});
