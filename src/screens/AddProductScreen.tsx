import React, { useState } from 'react';
import {
  Alert, Image, Modal, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>;

// ─── Product Types ─────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { key: 'physical', label: 'Physical Product', desc: 'Products that require shipping.', icon: 'cube-outline', color: '#FF6A2B' },
  { key: 'digital', label: 'Digital Product', desc: 'Files for upload, download link, expiry optional.', icon: 'download-outline', color: '#3E7BFA' },
  { key: 'service', label: 'Service', desc: 'Bookable or custom services.', icon: 'construct-outline', color: '#8B5CF6' },
  { key: 'subscription', label: 'Subscription', desc: 'Recurring payments / memberships.', icon: 'refresh-circle-outline', color: '#2ED47A' },
  { key: 'course', label: 'Course / Digital Learning', desc: 'Online courses and lessons.', icon: 'school-outline', color: '#F59E0B' },
  { key: 'gift-card', label: 'Gift Card', desc: 'Sell store gift cards.', icon: 'gift-outline', color: '#EC4899' },
] as const;

type ProductType = typeof PRODUCT_TYPES[number]['key'];

const CATEGORIES = [
  'Health & Wellness', 'Nutrition', 'Fitness', 'Beauty & Personal Care', 'Fashion',
  'Food & Beverages', 'Education', 'Personal Development', 'Business', 'Finance',
  'Technology', 'Home & Lifestyle', 'Services', 'Entertainment', 'Games', 'Other',
];

const STEPS = ['Product Type', 'Basic Info', 'Pricing & Inventory', 'Media', 'Shipping', 'Variants', 'SEO', 'Options', 'Review'];

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AddProductScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Step 0 – Type
  const [productType, setProductType] = useState<ProductType>('physical');

  // Step 1 – Basic Info
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [sku, setSku] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQty, setStockQty] = useState('100');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');

  // Step 2 – Pricing
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');

  // Step 3 – Media
  const [images, setImages] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState('');
  const [documentUri, setDocumentUri] = useState('');

  // Step 4 – Shipping (physical only)
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [customShipping, setCustomShipping] = useState(false);
  const [weight, setWeight] = useState('');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [shipsInternationally, setShipsInternationally] = useState(false);
  const [processingTime, setProcessingTime] = useState('1-3 Business Days');

  // Step 5 – Variants
  const [variants, setVariants] = useState<{ name: string; options: string[] }[]>([]);
  const [differentPrices, setDifferentPrices] = useState(false);

  // Step 6 – SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [urlHandle, setUrlHandle] = useState('');

  // Step 7 – Options
  const [allowReviews, setAllowReviews] = useState(true);
  const [allowQA, setAllowQA] = useState(true);
  const [showStockQty, setShowStockQty] = useState(true);
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [soldIndividually, setSoldIndividually] = useState(false);
  const [addToWishlist, setAddToWishlist] = useState(true);
  const [productBadge, setProductBadge] = useState('');
  const [visibility, setVisibility] = useState('published');

  const pickImages = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6, quality: 0.85 });
    if (!r.canceled) setImages(prev => [...prev, ...r.assets.map(a => a.uri)].slice(0, 6));
  };

  const pickVideo = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime'] });
    if (!r.canceled) setVideoUri(r.assets[0].uri);
  };

  const pickDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!r.canceled) setDocumentUri(r.assets[0].uri);
  };

  const addVariant = () => setVariants(prev => [...prev, { name: '', options: [] }]);
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, j) => j !== i));
  const updateVariantName = (i: number, val: string) => setVariants(prev => prev.map((v, j) => j === i ? { ...v, name: val } : v));

  const next = () => {
    if (step === 1 && !name.trim()) return Alert.alert('Product name required');
    if (step === 1 && !category) return Alert.alert('Category required');
    if (step === 2 && !price.trim()) return Alert.alert('Price required');
    setStep(s => s + 1);
  };

  const publish = async (status: 'published' | 'draft') => {
    setBusy(true);
    try {
      const newProduct = {
        title: name.trim(),
        type: productType,
        price: Number(price) || 0,
        comparePrice: Number(comparePrice) || 0,
        costPrice: Number(costPrice) || 0,
        shortDescription: shortDesc,
        description,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        sku,
        stock: Number(stockQty) || 0,
        trackInventory, lowStockAlert, lowStockThreshold: Number(lowStockThreshold),
        image: images[0],
        images,
        videoUri: videoUri || undefined,
        documentUri: documentUri || undefined,
        requiresShipping, customShipping, weight, dimensions: { l: dimL, w: dimW, h: dimH },
        shipsInternationally, processingTime,
        variants, differentPrices,
        seoTitle, seoDesc, urlHandle: urlHandle || name.toLowerCase().replace(/\s+/g, '-'),
        allowReviews, allowQA, showStockQty, allowBackorders, soldIndividually,
        addToWishlist, productBadge, status,
      };
      await earnService.createStoreProduct(storeId, newProduct);
      Alert.alert('Product Added!', `"${name}" has been created and is now live in your store.`, [
        { text: 'Add Another Product', onPress: () => { setStep(0); setName(''); setPrice(''); setImages([]); } },
        { text: 'View All Products', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isPhysical = productType === 'physical';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
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
          <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
        ))}
      </View>

      {/* ── Step 0: Select Product Type ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.stepTitle}>Select Product Type</Text>
          <Text style={s.stepSub}>Choose the type of product you want to add to your store.</Text>
          {PRODUCT_TYPES.map(pt => (
            <TouchableOpacity
              key={pt.key}
              style={[s.typeCard, productType === pt.key && s.typeCardActive]}
              onPress={() => setProductType(pt.key)}
              activeOpacity={0.75}
            >
              <View style={[s.typeIcon, { backgroundColor: pt.color + '20' }]}>
                <Ionicons name={pt.icon as any} size={22} color={pt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeLabel, productType === pt.key && s.typeLabelActive]}>{pt.label}</Text>
                <Text style={s.typeDesc}>{pt.desc}</Text>
              </View>
              <View style={[s.radio, productType === pt.key && s.radioActive]}>
                {productType === pt.key && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Basic Information</Text>
          <Field label="Product Name" value={name} onChangeText={setName} required maxLength={100} />
          <Field label="Short Description" value={shortDesc} onChangeText={setShortDesc} maxLength={160} />
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000} />
          <DropdownField label="Category" value={category} placeholder="Select category" open={openDropdown === 'cat'} onOpen={() => setOpenDropdown('cat')} onClose={() => setOpenDropdown(null)} options={CATEGORIES} onSelect={v => { setCategory(v); setOpenDropdown(null); }} />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="protein, health, plant-based" />
          <Field label="SKU (Optional)" value={sku} onChangeText={setSku} placeholder="PROD-001" />

          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Track Inventory</Text>
            <Switch value={trackInventory} onValueChange={setTrackInventory} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          {trackInventory && <>
            <Field label="Stock Quantity" value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" />
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Low Stock Alert</Text>
              <Switch value={lowStockAlert} onValueChange={setLowStockAlert} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
            </View>
            {lowStockAlert && <Field label="Low Stock Threshold" value={lowStockThreshold} onChangeText={setLowStockThreshold} keyboardType="number-pad" />}
          </>}
        </ScrollView>
      )}

      {/* ── Step 2: Pricing & Inventory ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Pricing & Inventory</Text>
          <PriceField label="Price" value={price} onChangeText={setPrice} required />
          <PriceField label="Compare at Price (Optional)" value={comparePrice} onChangeText={setComparePrice} />
          <PriceField label="Cost Price (Optional)" value={costPrice} onChangeText={setCostPrice} />
          <Field label="SKU (Optional)" value={sku} onChangeText={setSku} placeholder="PROD-001" />
          <Field label="Stock Quantity" value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Track Inventory</Text>
            <Switch value={trackInventory} onValueChange={setTrackInventory} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Low Stock Alert</Text>
            <Switch value={lowStockAlert} onValueChange={setLowStockAlert} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          {lowStockAlert && <Field label="Low Stock Threshold" value={lowStockThreshold} onChangeText={setLowStockThreshold} keyboardType="number-pad" />}
        </ScrollView>
      )}

      {/* ── Step 3: Media ── */}
      {step === 3 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.stepTitle}>Images & Media</Text>
          <Text style={s.stepSub}>You can upload up to 6 images.</Text>
          <View style={s.imagesGrid}>
            {images.map((uri, i) => (
              <View key={i} style={s.imageBox}>
                <Image source={{ uri }} style={s.imageTile} />
                <TouchableOpacity style={s.imageRemove} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                  <Ionicons name="close-circle" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 6 && (
              <TouchableOpacity style={[s.imageBox, s.imageBoxAdd]} onPress={pickImages}>
                <Ionicons name="add" size={24} color={colors.primary} />
                <Text style={s.imageAddText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={s.mediaPickBtn} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={18} color={colors.primary} />
            <Text style={s.mediaPickText}>{videoUri ? '✓ Video added' : '+ Add Video'}</Text>
            <Text style={s.mediaPickSub}>MP4, MOV up to 200MB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.mediaPickBtn} onPress={pickDocument}>
            <Ionicons name="document-outline" size={18} color={colors.primary} />
            <Text style={s.mediaPickText}>{documentUri ? '✓ Document added' : '+ Add Document'}</Text>
            <Text style={s.mediaPickSub}>PDF up to 20MB</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Step 4: Shipping ── */}
      {step === 4 && (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Shipping</Text>
          {!isPhysical && (
            <View style={s.noShippingNote}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={s.noShippingText}>This section is for Physical Products, Digital, Service, Subscription and Courses will skip this step.</Text>
            </View>
          )}
          <View style={s.radioRow}>
            <TouchableOpacity style={s.radioOption} onPress={() => setCustomShipping(false)}>
              <View style={[s.radio, !customShipping && s.radioActive]}>{!customShipping && <View style={s.radioDot} />}</View>
              <Text style={s.radioLabel}>Use store shipping settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.radioOption} onPress={() => setCustomShipping(true)}>
              <View style={[s.radio, customShipping && s.radioActive]}>{customShipping && <View style={s.radioDot} />}</View>
              <Text style={s.radioLabel}>Set custom shipping for this product</Text>
            </TouchableOpacity>
          </View>

          <Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="1.20" />

          <Text style={s.fieldLabel}>Dimensions (Optional)</Text>
          <View style={s.dimsRow}>
            <View style={{ flex: 1 }}><Field label="L" value={dimL} onChangeText={setDimL} keyboardType="decimal-pad" placeholder="20" /></View>
            <View style={{ flex: 1 }}><Field label="W" value={dimW} onChangeText={setDimW} keyboardType="decimal-pad" placeholder="10" /></View>
            <View style={{ flex: 1 }}><Field label="H" value={dimH} onChangeText={setDimH} keyboardType="decimal-pad" placeholder="15" /></View>
          </View>

          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Requires Shipping</Text>
            <Switch value={requiresShipping} onValueChange={setRequiresShipping} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Ships Internationally</Text>
            <Switch value={shipsInternationally} onValueChange={setShipsInternationally} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <DropdownField label="Processing Time" value={processingTime} placeholder="Select" open={openDropdown === 'proc'} onOpen={() => setOpenDropdown('proc')} onClose={() => setOpenDropdown(null)} options={['Same Day', '1-2 Business Days', '1-3 Business Days', '3-5 Business Days', '1-2 Weeks', '2-4 Weeks']} onSelect={v => { setProcessingTime(v); setOpenDropdown(null); }} />
        </ScrollView>
      )}

      {/* ── Step 5: Variants ── */}
      {step === 5 && (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>Variants (Optional)</Text>
          <Text style={s.stepSub}>Add variants like size, color, style, etc.</Text>

          {variants.map((v, i) => (
            <View key={i} style={[s.variantCard, shadow.soft]}>
              <View style={s.variantHeader}>
                <Field label="Variant Name (e.g. Size, Color)" value={v.name} onChangeText={val => updateVariantName(i, val)} />
                <TouchableOpacity onPress={() => removeVariant(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={s.fieldLabel}>Options</Text>
              <View style={s.variantChips}>
                {['Small', 'Medium', 'Large'].map(opt => (
                  <View key={opt} style={s.variantChip}><Text style={s.variantChipText}>{opt}</Text></View>
                ))}
                <TouchableOpacity style={[s.variantChip, s.variantChipAdd]}>
                  <Ionicons name="add" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.addVariantBtn} onPress={addVariant}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={s.addVariantText}>Add Another Option</Text>
          </TouchableOpacity>

          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Set different price for variants</Text>
            <Switch value={differentPrices} onValueChange={setDifferentPrices} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
        </ScrollView>
      )}

      {/* ── Step 6: SEO ── */}
      {step === 6 && (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.stepTitle}>SEO & Visibility</Text>
          <Field label="SEO Title (Optional)" value={seoTitle} onChangeText={setSeoTitle} maxLength={60} placeholder={`${name} – ${category || 'Your Store'}`} />
          <Field label="SEO Description (Optional)" value={seoDesc} onChangeText={setSeoDesc} multiline maxLength={160} placeholder="High quality plant-based protein to support your daily nutrition and fitness goals." />
          <Field label="URL Handle" value={urlHandle || name.toLowerCase().replace(/\s+/g, '-')} onChangeText={setUrlHandle} placeholder="organic-protein-powder" />

          <Text style={s.fieldLabel}>Visibility</Text>
          {['published', 'hidden', 'draft'].map(v => (
            <TouchableOpacity key={v} style={s.radioOption} onPress={() => setVisibility(v)}>
              <View style={[s.radio, visibility === v && s.radioActive]}>{visibility === v && <View style={s.radioDot} />}</View>
              <View>
                <Text style={s.radioLabel}>{v === 'published' ? 'Published' : v === 'hidden' ? 'Hidden' : 'Draft'}</Text>
                <Text style={s.radioSub}>{v === 'published' ? 'Make product visible to customers' : v === 'hidden' ? 'Hidden from search but accessible via link' : 'Save as draft'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Step 7: Product Options ── */}
      {step === 7 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.stepTitle}>Product Options</Text>
          <ToggleRow label="Allow Reviews" value={allowReviews} onChange={setAllowReviews} />
          <ToggleRow label="Allow Customer Q&A" value={allowQA} onChange={setAllowQA} />
          <ToggleRow label="Show Stock Quantity" value={showStockQty} onChange={setShowStockQty} />
          <ToggleRow label="Allow Backorders" value={allowBackorders} onChange={setAllowBackorders} />
          <ToggleRow label="Sold Individually" value={soldIndividually} onChange={setSoldIndividually} sub="Limit: 1 per order" />
          <ToggleRow label="Add to Wishlist" value={addToWishlist} onChange={setAddToWishlist} />
          <ToggleRow label="Enable Product Badges" value={!!productBadge} onChange={v => setProductBadge(v ? 'New Arrival' : '')} />
          {productBadge ? (
            <View style={s.badgeRow}>
              {['New Arrival', 'Bestseller', 'On Sale', 'Limited'].map(b => (
                <TouchableOpacity key={b} style={[s.badgeChip, productBadge === b && s.badgeChipActive]} onPress={() => setProductBadge(b)}>
                  <Text style={[s.badgeChipText, productBadge === b && s.badgeChipTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* ── Step 8: Review ── */}
      {step === 8 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.stepTitle}>Review Your Product</Text>
          <View style={[s.reviewCard, shadow.soft]}>
            {images[0] ? <Image source={{ uri: images[0] }} style={s.reviewImage} /> : null}
            <Text style={s.reviewName}>{name}</Text>
            <Text style={s.reviewType}>{PRODUCT_TYPES.find(p => p.key === productType)?.label}</Text>
          </View>

          <View style={[s.summaryCard, shadow.soft]}>
            {[
              { label: 'Price', value: `$${price} USD` },
              { label: 'Compare at', value: comparePrice ? `$${comparePrice} USD` : '—' },
              { label: 'SKU', value: sku || '—' },
              { label: 'Stock', value: stockQty },
              { label: 'Category', value: category },
              { label: 'Shipping', value: isPhysical ? processingTime : 'N/A' },
              { label: 'Status', value: visibility === 'published' ? 'Published' : 'Draft' },
            ].map(row => (
              <View key={row.label} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{row.label}</Text>
                <Text style={s.summaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.reviewActions}>
            <TouchableOpacity style={s.editBtn} onPress={() => setStep(1)}>
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={() => publish('published')} disabled={busy}>
              <Text style={s.saveBtnText}>{busy ? 'Saving…' : 'Save & Continue'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Bottom Nav */}
      {step < 8 && (
        <View style={s.navRow}>
          <TouchableOpacity style={s.continueBtn} onPress={next} disabled={busy}>
            <Text style={s.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, value, onChangeText, placeholder, multiline, maxLength, required, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; maxLength?: number;
  required?: boolean; keyboardType?: any;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}{required && <Text style={{ color: colors.primary }}> *</Text>}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder ?? label} placeholderTextColor={colors.textMuted}
        multiline={multiline} maxLength={maxLength} keyboardType={keyboardType ?? 'default'}
      />
      {maxLength && <Text style={s.charCount}>{value.length}/{maxLength}</Text>}
    </View>
  );
}

function PriceField({ label, value, onChangeText, required }: { label: string; value: string; onChangeText: (v: string) => void; required?: boolean }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}{required && <Text style={{ color: colors.primary }}> *</Text>}</Text>
      <View style={s.priceRow}>
        <Text style={s.priceCurrency}>$</Text>
        <TextInput style={[s.input, { flex: 1 }]} value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
        <Text style={s.priceCurrencyRight}>USD</Text>
      </View>
    </View>
  );
}

function DropdownField({ label, value, placeholder, open, onOpen, onClose, options, onSelect }: {
  label: string; value: string; placeholder: string; open: boolean;
  onOpen: () => void; onClose: () => void; options: string[]; onSelect: (v: string) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
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
                <TouchableOpacity key={opt} style={[s.optRow, value === opt && s.optRowActive]} onPress={() => onSelect(opt)}>
                  <Text style={[s.optText, value === opt && s.optTextActive]}>{opt}</Text>
                  {value === opt && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ToggleRow({ label, value, onChange, sub }: { label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        {sub ? <Text style={s.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  stepBar: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: spacing.xs },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  dotDone: { backgroundColor: colors.primary },
  content: { padding: spacing.lg, paddingBottom: 100 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  stepSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border },
  typeCardActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  typeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  typeLabelActive: { color: colors.primary },
  typeDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  radioRow: { gap: spacing.sm, marginBottom: spacing.md },
  radioOption: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.xs },
  radioLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  radioSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md },
  dropdownText: { fontSize: 13, color: colors.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md },
  priceCurrency: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginRight: spacing.xs },
  priceCurrencyRight: { fontSize: 12, color: colors.textSecondary, marginLeft: spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  toggleSub: { fontSize: 11, color: colors.textSecondary },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  imageBox: { width: 90, height: 90, borderRadius: radii.lg, overflow: 'hidden' },
  imageTile: { width: '100%', height: '100%' },
  imageRemove: { position: 'absolute', top: 4, right: 4 },
  imageBoxAdd: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#FFF8F5', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imageAddText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  mediaPickBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  mediaPickText: { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  mediaPickSub: { fontSize: 10, color: colors.textMuted },
  noShippingNote: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FFF8F5', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  noShippingText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  dimsRow: { flexDirection: 'row', gap: spacing.sm },
  variantCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  variantHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  variantChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  variantChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: '#F5F5F7', borderRadius: radii.pill },
  variantChipAdd: { backgroundColor: '#FFF0E8', borderWidth: 1, borderColor: colors.primary },
  variantChipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  addVariantBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  addVariantText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  badgeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  badgeChipActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  badgeChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  badgeChipTextActive: { color: colors.primary },
  reviewCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  reviewImage: { width: 80, height: 80, borderRadius: radii.lg },
  reviewName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  reviewType: { fontSize: 12, color: colors.textSecondary },
  summaryCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { width: 100, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryValue: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  reviewActions: { flexDirection: 'row', gap: spacing.md },
  editBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  saveBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  navRow: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  continueBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  optRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optRowActive: { backgroundColor: '#FFF0E8' },
  optText: { fontSize: 13, color: colors.textPrimary },
  optTextActive: { color: colors.primary, fontWeight: '700' },
});
