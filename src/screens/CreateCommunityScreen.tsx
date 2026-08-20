/**
 * Create Community – 4-step flow matching the Halo Health design
 *
 * Step 1 – Basics      : Name · Description · Category · Cover pick
 * Step 2 – Visibility  : Public / Private + screening questions (private only)
 * Step 3 – Pricing     : Free / Recurring / One-time / Pay-what-you-want
 *                        + Amount · Interval (recurring) · Free trial
 * Step 4 – Settings    : Rules · Plugins · Ad-tracking pixels → Create
 */
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { groupsService } from '../services/api/groups.service';
import { postsService } from '../services/api/posts.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCommunity'>;

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

const COMMUNITY_CATEGORIES = [
  'Nutrition', 'Fitness', 'Weight Loss', 'Mental Health', 'Wellness',
  'Strength', 'Yoga', 'Running', 'Cycling', 'Supplements',
  'Sleep', 'Mindset', 'Recipes', 'Fasting', 'Other',
];

const COVER_PRESETS: { uri: string; bg: string }[] = [
  { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', bg: '#D6EFD8' },
  { uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80', bg: '#FEF3C7' },
  { uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', bg: '#E0F2FE' },
  { uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', bg: '#FCE7F3' },
  { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', bg: '#F3E8FF' },
  { uri: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80', bg: '#D1FAE5' },
  { uri: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80', bg: '#FEE2E2' },
  { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', bg: '#FFF7ED' },
];

const SOLID_COVERS = ['#A7F3D0', '#FDE68A', '#BFDBFE', '#FBCFE8', '#DDD6FE'];

const PRICING_MODELS = [
  { key: 'free', label: 'Free' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'one-time', label: 'One-time' },
  { key: 'pwyw', label: 'Pay what you want' },
] as const;
type PricingModel = (typeof PRICING_MODELS)[number]['key'];

const TRIAL_OPTIONS = ['No trial', '3 days', '7 days', '14 days', '30 days'];
const INTERVAL_OPTIONS = ['Monthly', 'Quarterly', 'Yearly'];

const PLUGINS = [
  { key: 'leaderboard', label: 'Top 10 leaderboard', default: true },
  { key: 'streaks', label: 'Streak tracking', default: true },
  { key: 'auto_dm', label: 'Auto DM new members', default: false },
  { key: 'instant_approval', label: 'Instant approval', default: true },
  { key: 'onboarding_video', label: 'Onboarding video', default: false },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function FieldInput({
  value, onChangeText, placeholder, multiline, keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      style={[s.fieldInput, multiline && s.fieldInputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'auto'}
      keyboardType={keyboardType}
    />
  );
}

function OptionRow({
  label, checked, onToggle,
}: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={s.optionRow} activeOpacity={0.85} onPress={onToggle}>
      <Text style={s.optionLabel}>{label}</Text>
      <View style={[s.checkbox, checked && s.checkboxActive]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

function SelectRow({
  label, options, value, onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={s.selectBox} onPress={() => setOpen((v) => !v)} activeOpacity={0.85}>
        <Text style={s.selectValue}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={s.dropdownCard}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={s.dropdownItem}
              onPress={() => { onSelect(opt); setOpen(false); }}
              activeOpacity={0.75}
            >
              <Text style={[s.dropdownText, opt === value && s.dropdownTextActive]}>{opt}</Text>
              {opt === value && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function CreateCommunityScreen({ navigation }: Props) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [coverUri, setCoverUri] = useState(COVER_PRESETS[0].uri);
  const [customCoverUri, setCustomCoverUri] = useState('');

  // Step 2
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [questions, setQuestions] = useState(['', '', '', '', '']);

  // Step 3
  const [pricing, setPricing] = useState<PricingModel>('free');
  const [amount, setAmount] = useState('9');
  const [interval, setInterval] = useState(INTERVAL_OPTIONS[0]);
  const [trial, setTrial] = useState(TRIAL_OPTIONS[0]);

  // Step 4
  const [rules, setRules] = useState('');
  const [plugins, setPlugins] = useState<Record<string, boolean>>(
    Object.fromEntries(PLUGINS.map((p) => [p.key, p.default]))
  );
  const [metaPixel, setMetaPixel] = useState('');
  const [tiktokPixel, setTiktokPixel] = useState('');
  const [snapPixel, setSnapPixel] = useState('');
  const [googleTag, setGoogleTag] = useState('');

  const displayCover = customCoverUri || coverUri;

  const pickCustomCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (result.canceled) return;
    setBusy(true);
    try {
      const url = await postsService.uploadImage({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType || 'image/jpeg', fileName: result.assets[0].fileName || 'cover.jpg' });
      setCustomCoverUri(url);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const goNext = async () => {
    if (step === 1 && !name.trim()) {
      return Alert.alert('Name required', 'Please enter a community name.');
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    // Final step — create
    setBusy(true);
    try {
      const group = await groupsService.create({
        name: name.trim(),
        description: description.trim(),
        isPrivate: visibility === 'private',
        cover: displayCover || undefined,
        // Extra metadata stored as JSON in description prefix (backend stores freely)
        meta: {
          category,
          visibility,
          screeningQuestions: visibility === 'private' ? questions.filter(Boolean) : [],
          pricing,
          amount: pricing !== 'free' ? Number(amount) || 0 : 0,
          interval: pricing === 'recurring' ? interval : undefined,
          trial,
          rules,
          plugins,
          adPixels: { meta: metaPixel, tiktok: tiktokPixel, snap: snapPixel, google: googleTag },
        },
      });
      navigation.replace('PowerSquad', { groupId: group.id });
    } catch (e) {
      Alert.alert('Unable to create community', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const continueLabel = step === TOTAL_STEPS
    ? (busy ? 'Creating…' : 'Create community')
    : 'Continue';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backCircle} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create community</Text>
        <Text style={s.stepLabel}>Step {step}/{TOTAL_STEPS}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ═══════════════ STEP 1 – Basics ═══════════════ */}
          {step === 1 && (
            <>
              <SectionLabel>NAME</SectionLabel>
              <FieldInput value={name} onChangeText={setName} placeholder="Clean Kitchen Club" />

              <SectionLabel>DESCRIPTION</SectionLabel>
              <FieldInput
                value={description}
                onChangeText={setDescription}
                placeholder="What's your community about?"
                multiline
              />

              <SectionLabel>CATEGORY</SectionLabel>
              <SelectRow
                label="Category"
                options={COMMUNITY_CATEGORIES}
                value={category}
                onSelect={setCategory}
              />

              <SectionLabel>COVER</SectionLabel>
              {/* Large preview */}
              <View style={s.coverPreview}>
                <Image source={{ uri: displayCover }} style={s.coverPreviewImg} resizeMode="cover" />
              </View>

              {/* Preset grid */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
                {COVER_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.uri}
                    style={[s.presetThumb, (coverUri === p.uri && !customCoverUri) && s.presetThumbActive]}
                    onPress={() => { setCoverUri(p.uri); setCustomCoverUri(''); }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: p.uri }} style={s.presetThumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
                {SOLID_COVERS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.presetThumb, { backgroundColor: c }, coverUri === c && !customCoverUri && s.presetThumbActive]}
                    onPress={() => { setCoverUri(c); setCustomCoverUri(''); }}
                    activeOpacity={0.85}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity style={s.changeCustomBtn} onPress={pickCustomCover} activeOpacity={0.85}>
                <Ionicons name="image-outline" size={16} color={colors.textPrimary} />
                <Text style={s.changeCustomText}>Change custom image</Text>
              </TouchableOpacity>
              {customCoverUri ? (
                <TouchableOpacity onPress={() => setCustomCoverUri('')}>
                  <Text style={s.removeCustomText}>Remove custom image</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {/* ═══════════════ STEP 2 – Visibility ═══════════════ */}
          {step === 2 && (
            <>
              <SectionLabel>VISIBILITY</SectionLabel>
              <View style={s.pricingGrid}>
                <TouchableOpacity
                  style={[s.visCard, visibility === 'public' && s.visCardActive]}
                  onPress={() => setVisibility('public')}
                  activeOpacity={0.85}
                >
                  <Text style={[s.visCardTitle, visibility === 'public' && s.visCardTitleActive]}>Public</Text>
                  <Text style={s.visCardSub}>Discoverable & instant join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.visCard, visibility === 'private' && s.visCardActive]}
                  onPress={() => setVisibility('private')}
                  activeOpacity={0.85}
                >
                  <Text style={[s.visCardTitle, visibility === 'private' && s.visCardTitleActive]}>Private</Text>
                  <Text style={s.visCardSub}>Invite link only, screening required</Text>
                </TouchableOpacity>
              </View>

              {visibility === 'private' && (
                <>
                  <SectionLabel>SCREENING QUESTIONS (UP TO 5)</SectionLabel>
                  {questions.map((q, i) => (
                    <TextInput
                      key={i}
                      style={s.fieldInput}
                      value={q}
                      onChangeText={(v) => {
                        const next = [...questions];
                        next[i] = v;
                        setQuestions(next);
                      }}
                      placeholder={`Question ${i + 1}`}
                      placeholderTextColor={colors.textMuted}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* ═══════════════ STEP 3 – Pricing ═══════════════ */}
          {step === 3 && (
            <>
              <SectionLabel>PRICING MODEL</SectionLabel>
              <View style={s.pricingGrid}>
                {PRICING_MODELS.map((pm) => (
                  <TouchableOpacity
                    key={pm.key}
                    style={[s.pricingCard, pricing === pm.key && s.pricingCardActive]}
                    onPress={() => setPricing(pm.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.pricingCardText, pricing === pm.key && s.pricingCardTextActive]}>
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {pricing !== 'free' && (
                <>
                  <SectionLabel>
                    {pricing === 'pwyw' ? 'MINIMUM AMOUNT (USD)' : 'AMOUNT (USD)'}
                  </SectionLabel>
                  <FieldInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="9"
                    keyboardType="numeric"
                  />
                </>
              )}

              {pricing === 'recurring' && (
                <>
                  <SectionLabel>INTERVAL</SectionLabel>
                  <SelectRow
                    label="Interval"
                    options={INTERVAL_OPTIONS}
                    value={interval}
                    onSelect={setInterval}
                  />
                </>
              )}

              {pricing !== 'free' && (
                <>
                  <SectionLabel>FREE TRIAL</SectionLabel>
                  <SelectRow
                    label="Free Trial"
                    options={TRIAL_OPTIONS}
                    value={trial}
                    onSelect={setTrial}
                  />
                </>
              )}
            </>
          )}

          {/* ═══════════════ STEP 4 – Settings ═══════════════ */}
          {step === 4 && (
            <>
              <SectionLabel>RULES</SectionLabel>
              <TextInput
                style={[s.fieldInput, s.fieldInputMulti, { minHeight: 100 }]}
                value={rules}
                onChangeText={setRules}
                placeholder="Be kind. Cite sources. No spam."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              <SectionLabel>PLUGINS</SectionLabel>
              {PLUGINS.map((p) => (
                <OptionRow
                  key={p.key}
                  label={p.label}
                  checked={plugins[p.key]}
                  onToggle={() => setPlugins((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                />
              ))}

              <SectionLabel>AD TRACKING PIXELS (OPTIONAL)</SectionLabel>
              <FieldInput value={metaPixel} onChangeText={setMetaPixel} placeholder="Meta (Facebook) Pixel ID" />
              <FieldInput value={tiktokPixel} onChangeText={setTiktokPixel} placeholder="TikTok Pixel ID" />
              <FieldInput value={snapPixel} onChangeText={setSnapPixel} placeholder="Snapchat Pixel ID" />
              <FieldInput value={googleTag} onChangeText={setGoogleTag} placeholder="Google Ads Tag ID" />
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.ctaBtn, busy && { opacity: 0.7 }]}
          onPress={goNext}
          disabled={busy}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#14B8C4', '#0891B2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaGradient}
          >
            <Text style={s.ctaText}>{continueLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8F9FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  fieldInput: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14.5,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldInputMulti: {
    minHeight: 90,
    paddingTop: spacing.md,
  },

  // Visibility cards
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  visCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  visCardActive: { borderColor: '#14B8C4', backgroundColor: '#F0FAFA' },
  visCardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  visCardTitleActive: { color: '#0E7490' },
  visCardSub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },

  // Pricing model cards
  pricingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingCardActive: { borderColor: '#14B8C4', backgroundColor: '#F0FAFA' },
  pricingCardText: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  pricingCardTextActive: { color: '#0E7490' },

  // Select dropdown
  selectBox: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  selectValue: { fontSize: 14.5, color: colors.textPrimary },
  dropdownCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: { fontSize: 14, color: colors.textPrimary },
  dropdownTextActive: { color: '#0E7490', fontWeight: '700' },

  // Cover
  coverPreview: {
    width: '100%',
    height: 150,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  coverPreviewImg: { width: '100%', height: '100%' },
  presetRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  presetThumb: {
    width: 72,
    height: 56,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.border,
  },
  presetThumbActive: { borderColor: '#14B8C4' },
  presetThumbImg: { width: '100%', height: '100%' },
  changeCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  changeCustomText: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  removeCustomText: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 12.5,
    color: colors.macroProtein,
    fontWeight: '600',
  },

  // Plugins / checkboxes
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  optionLabel: { fontSize: 14.5, color: colors.textPrimary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  ctaBtn: { borderRadius: radii.pill, overflow: 'hidden' },
  ctaGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
