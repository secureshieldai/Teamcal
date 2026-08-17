import React, { useState } from 'react';
import {
  Alert, Image, Linking, Modal, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, shadow, spacing, typography } from '../theme';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'CreateStore'>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Basic Details', 'Store Profile', 'Description', 'Store URL', 'Settings', 'Payment', 'Add Products', 'Review'];

const STORE_CATEGORIES = [
  'General Store', 'Health & Wellness', 'Nutrition', 'Fitness',
  'Beauty & Personal Care', 'Fashion', 'Food & Beverages', 'Education',
  'Personal Development', 'Business', 'Finance', 'Technology',
  'Home & Lifestyle', 'Services', 'Creator Store', 'Entertainment',
  'Games', 'Other',
];

const CURRENCIES = ['USD – US Dollar', 'EUR – Euro', 'GBP – British Pound', 'CAD – Canadian Dollar', 'AUD – Australian Dollar', 'INR – Indian Rupee', 'NGN – Nigerian Naira', 'Other'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi', 'Chinese', 'Japanese', 'Korean', 'Other'];
const TIMEZONES = ['(GMT-05:00) Eastern Time (US & Canada)', '(GMT-06:00) Central Time', '(GMT-07:00) Mountain Time', '(GMT-08:00) Pacific Time', '(GMT+00:00) UTC', '(GMT+01:00) London', '(GMT+02:00) Paris', '(GMT+05:30) Mumbai'];

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function CreateStoreScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 0 – Basic Details
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');

  // Step 1 – Store Profile
  const [logoUri, setLogoUri] = useState('');
  const [coverUri, setCoverUri] = useState('');

  // Step 2 – Description
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');

  // Step 3 – Store URL
  const [urlSlug, setUrlSlug] = useState('');

  // Step 4 – Settings
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [currency, setCurrency] = useState('USD – US Dollar');
  const [supportEmail, setSupportEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [storeEnabled, setStoreEnabled] = useState(true);

  // Step 5 – Payment
  const [stripeConnected, setStripeConnected] = useState(false);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ── Helpers ──

  const suggestSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const pickLogo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, aspect: [1, 1], allowsEditing: true });
    if (!r.canceled) setLogoUri(r.assets[0].uri);
  };

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const next = () => {
    if (step === 0 && !storeName.trim()) return Alert.alert('Store name required');
    if (step === 2 && !shortDesc.trim()) return Alert.alert('Short description required');
    if (step === 3) {
      if (!urlSlug.trim()) return Alert.alert('Store URL required');
      if (!/^[a-z0-9-]+$/.test(urlSlug)) return Alert.alert('Invalid URL', 'Only lowercase letters, numbers and hyphens allowed.');
    }
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind: 'store',
        subtype: category || 'general',
        title: storeName.trim(),
        description,
        image: logoUri || undefined,
        status,
        metadata: {
          shortDescription: shortDesc,
          coverImage: coverUri || undefined,
          urlSlug: urlSlug || suggestSlug(storeName),
          category,
          country,
          timezone,
          currency: currency.split(' – ')[0],
          supportEmail,
          language,
          storeEnabled,
          stripeConnected,
          products: [],
        },
      });
      navigation.replace('StoreDashboard', { storeId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ── Render ──

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(st => st - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{STEPS[step]}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Step dots */}
      <View style={s.stepBar}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.stepDot, i === step && s.stepDotActive, i < step && s.stepDotDone]} />
        ))}
      </View>

      {/* ── Step 0: Basic Details ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
          <View style={s.illustrationRow}>
            <View style={s.storeIllustration}>
              <Ionicons name="storefront-outline" size={48} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepTitle}>Let's start with your store basics</Text>
              <Text style={s.stepSub}>You can always change these details later.</Text>
            </View>
          </View>

          <Label text="Store Name" required />
          <Input value={storeName} onChangeText={v => { setStoreName(v); if (!urlSlug) setUrlSlug(suggestSlug(v)); }} placeholder="Enter store name" />

          <Label text="Store Category (Optional)" />
          <DropdownField
            value={category} placeholder="Select store type"
            open={openDropdown === 'category'} onOpen={() => setOpenDropdown('category')} onClose={() => setOpenDropdown(null)}
            options={STORE_CATEGORIES} onSelect={v => { setCategory(v); setOpenDropdown(null); }}
          />
          <Text style={s.hint}>You can sell physical, digital products, services, subscriptions and more.</Text>
        </ScrollView>
      )}

      {/* ── Step 1: Store Profile ── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={s.stepContent}>
          <Label text="Store Logo / Display Picture" required />
          <TouchableOpacity style={s.logoPicker} onPress={pickLogo}>
            {logoUri
              ? <Image source={{ uri: logoUri }} style={s.logoImage} />
              : <>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                <Text style={s.uploadLabel}>Upload Image</Text>
                <Text style={s.uploadSub}>JPG, PNG or WEBP (Max 5MB)</Text>
              </>}
          </TouchableOpacity>
          {logoUri ? <TouchableOpacity onPress={pickLogo}><Text style={s.changeLink}>Change Logo</Text></TouchableOpacity> : null}

          <Label text="Store Cover Image (Optional)" />
          <TouchableOpacity style={s.coverPicker} onPress={pickCover}>
            {coverUri
              ? <Image source={{ uri: coverUri }} style={s.coverImage} />
              : <Ionicons name="image-outline" size={28} color={colors.textMuted} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickCover}><Text style={s.changeLink}>{coverUri ? 'Change Cover' : 'Upload Cover'}</Text></TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Step 2: Description ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
          <Label text="Short Description" required />
          <Input value={shortDesc} onChangeText={setShortDesc} placeholder="A short tagline for your store." maxLength={80} multiline />
          <CharCount value={shortDesc} max={80} />

          <Label text="Description" />
          <Input value={description} onChangeText={setDescription} placeholder="Tell customers what makes it unique and why they should shop with you." maxLength={500} multiline style={{ minHeight: 120 }} />
          <CharCount value={description} max={500} />
        </ScrollView>
      )}

      {/* ── Step 3: Store URL ── */}
      {step === 3 && (
        <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
          <Label text="Choose Your Store URL" required />
          <Text style={s.stepSub}>This will be your unique store link on TeamCal.</Text>

          <View style={s.urlRow}>
            <Text style={s.urlPrefix}>teamcal.store/ </Text>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={urlSlug}
              onChangeText={v => setUrlSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="yourstorename"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.urlRules}>
            <RuleRow text="Only lowercase letters, numbers and hyphens allowed" />
            <RuleRow text="3–40 characters" />
            <RuleRow text="Must be unique" />
          </View>

          <View style={s.urlPreviewBox}>
            <Text style={s.urlPreviewLabel}>Your Store Link Preview</Text>
            <Text style={s.urlPreviewValue}>https://teamcal.store/{urlSlug || 'yourstorename'}</Text>
          </View>
        </ScrollView>
      )}

      {/* ── Step 4: Settings ── */}
      {step === 4 && (
        <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
          <Label text="Business Location" />
          <DropdownField value={country} placeholder="Select country" open={openDropdown === 'country'} onOpen={() => setOpenDropdown('country')} onClose={() => setOpenDropdown(null)} options={['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Nigeria', 'India', 'Other']} onSelect={v => { setCountry(v); setOpenDropdown(null); }} />

          <Label text="Time Zone" />
          <DropdownField value={timezone} placeholder="Select timezone" open={openDropdown === 'timezone'} onOpen={() => setOpenDropdown('timezone')} onClose={() => setOpenDropdown(null)} options={TIMEZONES} onSelect={v => { setTimezone(v); setOpenDropdown(null); }} />

          <Label text="Store Currency" />
          <DropdownField value={currency} placeholder="Select currency" open={openDropdown === 'currency'} onOpen={() => setOpenDropdown('currency')} onClose={() => setOpenDropdown(null)} options={CURRENCIES} onSelect={v => { setCurrency(v); setOpenDropdown(null); }} />

          <Label text="Customer Support Email" />
          <Input value={supportEmail} onChangeText={setSupportEmail} placeholder="support@yourstore.com" keyboardType="email-address" />

          <Label text="Store Language" />
          <DropdownField value={language} placeholder="Select language" open={openDropdown === 'language'} onOpen={() => setOpenDropdown('language')} onClose={() => setOpenDropdown(null)} options={LANGUAGES} onSelect={v => { setLanguage(v); setOpenDropdown(null); }} />

          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Enable Store</Text>
              <Text style={s.toggleSub}>Your store will be visible to customers after publishing.</Text>
            </View>
            <Switch value={storeEnabled} onValueChange={setStoreEnabled} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
        </ScrollView>
      )}

      {/* ── Step 5: Payment Setup ── */}
      {step === 5 && (
        <ScrollView contentContainerStyle={s.stepContent}>
          <View style={s.paymentCenter}>
            <View style={s.stripeCircle}>
              <Text style={s.stripeS}>S</Text>
            </View>
            <Text style={s.paymentTitle}>Connect Stripe</Text>
            <Text style={s.paymentSub}>Connect your Stripe account to accept payments.</Text>
          </View>

          <TouchableOpacity
            style={s.stripeBtn}
            onPress={async () => {
              try {
                const result = await earnService.connectStripe();
                if (result.onboardingUrl) await Linking.openURL(result.onboardingUrl);
                setStripeConnected(true);
              } catch (e) {
                Alert.alert('Stripe connection failed', (e as Error).message);
              }
            }}
          >
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={s.stripeBtnText}>Connect Stripe</Text>
          </TouchableOpacity>

          {stripeConnected && (
            <View style={s.connectedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={s.connectedText}>Stripe connected</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Step 6: Add Products (optional skip) ── */}
      {step === 6 && (
        <ScrollView contentContainerStyle={s.stepContent}>
          <View style={s.addProductsCenter}>
            <Ionicons name="cube-outline" size={56} color={colors.primary} />
            <Text style={s.paymentTitle}>Add products to your store</Text>
            <Text style={s.paymentSub}>Start adding products now or skip this step and add them later.</Text>
          </View>
          <TouchableOpacity style={s.addProductsNowBtn} onPress={() => setStep(7)}>
            <Text style={s.addProductsNowText}>Add Products Now</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Step 7: Review & Publish ── */}
      {step === 7 && (
        <ScrollView contentContainerStyle={s.stepContent}>
          <View style={s.reviewHeader}>
            <Text style={s.stepTitle}>Review Your Store</Text>
            <TouchableOpacity onPress={() => setStep(0)}><Text style={s.editLink}>Edit</Text></TouchableOpacity>
          </View>

          <View style={[s.summaryCard, shadow.soft]}>
            {[
              { label: 'Store Name', value: storeName },
              { label: 'Store URL', value: `teamcal.store/${urlSlug}` },
              { label: 'Store Type', value: category || 'General Store' },
              { label: 'Currency', value: currency.split(' – ')[0] },
              { label: 'Payment Provider', value: stripeConnected ? 'Stripe ✓' : 'Not connected' },
              { label: 'Products', value: '0 Products' },
              { label: 'Store Status', value: storeEnabled ? 'Enabled' : 'Disabled' },
            ].map(row => (
              <View key={row.label} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{row.label}</Text>
                <Text style={s.summaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.termsRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
            <Text style={s.termsText}>I agree to the Terms of Service and Privacy Policy.</Text>
          </View>

          <TouchableOpacity style={s.publishBtn} onPress={() => publish('published')} disabled={busy}>
            <Text style={s.publishBtnText}>{busy ? 'Publishing…' : 'Publish Store'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.draftBtn} onPress={() => publish('draft')} disabled={busy}>
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Bottom nav */}
      {step < 7 && (
        <View style={s.navRow}>
          {step === 5 ? (
            <TouchableOpacity style={s.skipBtn} onPress={() => setStep(s => s + 1)}>
              <Text style={s.skipBtnText}>Skip for Later</Text>
            </TouchableOpacity>
          ) : null}
          {step === 6 ? (
            <TouchableOpacity style={s.skipBtn} onPress={() => setStep(7)}>
              <Text style={s.skipBtnText}>Skip for Later</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={s.continueBtn} onPress={next} disabled={busy}>
            <Text style={s.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Small helper components ───────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={s.label}>{text}{required && <Text style={{ color: colors.primary }}> *</Text>}</Text>
  );
}

function Input({ value, onChangeText, placeholder, multiline, maxLength, keyboardType, style }: {
  value: string; onChangeText: (v: string) => void; placeholder?: string;
  multiline?: boolean; maxLength?: number; keyboardType?: any; style?: any;
}) {
  return (
    <TextInput
      style={[s.input, multiline && s.inputMulti, style]}
      value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={colors.textMuted}
      multiline={multiline} maxLength={maxLength}
      keyboardType={keyboardType ?? 'default'}
    />
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return <Text style={s.charCount}>{value.length}/{max}</Text>;
}

function RuleRow({ text }: { text: string }) {
  return (
    <View style={s.ruleRow}>
      <Ionicons name="checkmark" size={14} color={colors.success} />
      <Text style={s.ruleText}>{text}</Text>
    </View>
  );
}

function DropdownField({ value, placeholder, open, onOpen, onClose, options, onSelect }: {
  value: string; placeholder: string; open: boolean;
  onOpen: () => void; onClose: () => void;
  options: string[]; onSelect: (v: string) => void;
}) {
  return (
    <>
      <TouchableOpacity style={s.dropdown} onPress={onOpen}>
        <Text style={[s.dropdownText, !value && { color: colors.textMuted }]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map(opt => (
                <TouchableOpacity key={opt} style={[s.optionRow, value === opt && s.optionRowActive]} onPress={() => onSelect(opt)}>
                  <Text style={[s.optionText, value === opt && s.optionTextActive]}>{opt}</Text>
                  {value === opt && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  stepBar: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary, width: 20 },
  stepDotDone: { backgroundColor: colors.primary },
  stepContent: { padding: spacing.lg, paddingBottom: 40 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  stepSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 16 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md },
  dropdownText: { fontSize: 13, color: colors.textPrimary },
  illustrationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  storeIllustration: { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  logoPicker: { height: 130, backgroundColor: colors.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  logoImage: { width: '100%', height: '100%', borderRadius: radii.xl },
  uploadLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
  uploadSub: { fontSize: 11, color: colors.textMuted },
  changeLink: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  coverPicker: { height: 140, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  urlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, overflow: 'hidden', marginBottom: spacing.sm },
  urlPrefix: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.sm, backgroundColor: '#F5F5F7' },
  urlRules: { gap: spacing.xs, marginBottom: spacing.md },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ruleText: { fontSize: 12, color: colors.textSecondary },
  urlPreviewBox: { backgroundColor: '#F0FFF4', borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.success + '40' },
  urlPreviewLabel: { fontSize: 11, fontWeight: '700', color: colors.success, marginBottom: 4 },
  urlPreviewValue: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  toggleSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  paymentCenter: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  stripeCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center' },
  stripeS: { fontSize: 36, fontWeight: '900', color: '#fff' },
  paymentTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  paymentSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  stripeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#635BFF', borderRadius: radii.pill, paddingVertical: spacing.md + 2, marginBottom: spacing.md },
  stripeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  connectedText: { fontSize: 13, fontWeight: '700', color: colors.success },
  addProductsCenter: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  addProductsNowBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  addProductsNowText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  editLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  summaryCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { width: 120, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryValue: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  termsText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  publishBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  continueBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  skipBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionRowActive: { backgroundColor: '#FFF0E8' },
  optionText: { fontSize: 13, color: colors.textPrimary },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
});
