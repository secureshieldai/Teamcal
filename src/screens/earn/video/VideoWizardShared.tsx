import React, { useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Switch, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../../theme';
import {
  MONETIZATION_OPTIONS, PREVIEW_OPTIONS, VIDEO_CATEGORIES, LANGUAGES,
  type MonetizationType, type PreviewType,
} from './videoData';

// ─── Step Indicator ───────────────────────────────────────────────────────────

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={sw.stepBar}>
      {steps.map((label, i) => (
        <View key={label} style={sw.stepItem}>
          <View style={[sw.stepDot, i < current && sw.stepDotDone, i === current && sw.stepDotActive]}>
            {i < current
              ? <Ionicons name="checkmark" size={10} color="#fff" />
              : <Text style={[sw.stepDotNum, i === current && { color: '#fff' }]}>{i + 1}</Text>}
          </View>
          {i < steps.length - 1 && <View style={[sw.stepLine, i < current && sw.stepLineDone]} />}
        </View>
      ))}
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function WizardHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={sw.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={sw.headerTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ─── Bottom Nav Buttons ───────────────────────────────────────────────────────

export function WizardNav({
  onBack, onNext, nextLabel = 'Next', backLabel = 'Back',
  nextDisabled = false, loading = false,
}: {
  onBack?: () => void; onNext: () => void; nextLabel?: string;
  backLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <View style={sw.navRow}>
      {onBack
        ? <TouchableOpacity style={sw.backBtn} onPress={onBack}><Text style={sw.backBtnText}>{backLabel}</Text></TouchableOpacity>
        : <View style={{ flex: 1 }} />}
      <TouchableOpacity
        style={[sw.nextBtn, nextDisabled && sw.nextBtnDisabled]}
        onPress={onNext}
        disabled={nextDisabled || loading}
      >
        <Text style={sw.nextBtnText}>{loading ? 'Saving…' : nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label, value, onChangeText, placeholder, multiline, maxLength, required, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; maxLength?: number;
  required?: boolean; keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={sw.field}>
      <Text style={sw.fieldLabel}>{label}{required && <Text style={{ color: colors.primary }}> *</Text>}</Text>
      <TextInput
        style={[sw.input, multiline && sw.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType ?? 'default'}
      />
      {maxLength && (
        <Text style={sw.charCount}>{value.length}/{maxLength}</Text>
      )}
    </View>
  );
}

// ─── Category Dropdown ────────────────────────────────────────────────────────

export function CategoryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sw.field}>
      <Text style={sw.fieldLabel}>Category <Text style={{ color: colors.primary }}>*</Text></Text>
      <TouchableOpacity style={sw.dropdown} onPress={() => setOpen(true)}>
        <Text style={[sw.dropdownText, !value && { color: colors.textMuted }]}>
          {value || 'Select category'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={sw.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={sw.modalSheet}>
            <View style={sw.modalHandle} />
            <Text style={sw.modalTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {VIDEO_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[sw.catRow, value === cat && sw.catRowActive]}
                  onPress={() => { onChange(cat); setOpen(false); }}
                >
                  <Text style={[sw.catRowText, value === cat && sw.catRowTextActive]}>{cat}</Text>
                  {value === cat && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Language Dropdown ────────────────────────────────────────────────────────

export function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sw.field}>
      <Text style={sw.fieldLabel}>Language</Text>
      <TouchableOpacity style={sw.dropdown} onPress={() => setOpen(true)}>
        <Text style={[sw.dropdownText, !value && { color: colors.textMuted }]}>{value || 'Select language'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={sw.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={sw.modalSheet}>
            <View style={sw.modalHandle} />
            <Text style={sw.modalTitle}>Select Language</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[sw.catRow, value === lang && sw.catRowActive]}
                  onPress={() => { onChange(lang); setOpen(false); }}
                >
                  <Text style={[sw.catRowText, value === lang && sw.catRowTextActive]}>{lang}</Text>
                  {value === lang && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Monetization Step ────────────────────────────────────────────────────────

export function MonetizationStep({
  selected, onSelect, price, onPrice,
  allowComments, onAllowComments,
  allowLikes, onAllowLikes,
  addToShowcase, onAddToShowcase,
  dropContent, onDropContent,
}: {
  selected: MonetizationType; onSelect: (v: MonetizationType) => void;
  price: string; onPrice: (v: string) => void;
  allowComments: boolean; onAllowComments: (v: boolean) => void;
  allowLikes: boolean; onAllowLikes: (v: boolean) => void;
  addToShowcase: boolean; onAddToShowcase: (v: boolean) => void;
  dropContent: boolean; onDropContent: (v: boolean) => void;
}) {
  return (
    <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={sw.stepTitle}>Monetization</Text>
      <Text style={sw.stepSub}>Choose how you want to earn from this video.</Text>

      {MONETIZATION_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[sw.monetizationCard, selected === opt.key && sw.monetizationCardActive]}
          onPress={() => onSelect(opt.key)}
        >
          <View style={[sw.monetizationIcon, selected === opt.key && sw.monetizationIconActive]}>
            <Ionicons name={opt.icon as any} size={20} color={selected === opt.key ? '#fff' : colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sw.monetizationLabel, selected === opt.key && sw.monetizationLabelActive]}>{opt.label}</Text>
            <Text style={sw.monetizationDesc}>{opt.description}</Text>
          </View>
          <View style={[sw.radioOuter, selected === opt.key && sw.radioOuterActive]}>
            {selected === opt.key && <View style={sw.radioInner} />}
          </View>
        </TouchableOpacity>
      ))}

      {(selected === 'paid' || selected === 'ppv' || selected === 'earn-per-complete') && (
        <View style={sw.priceRow}>
          <Text style={sw.fieldLabel}>Set Your Price / Rate</Text>
          <View style={sw.priceInputRow}>
            <Text style={sw.priceCurrency}>$</Text>
            <TextInput
              style={sw.priceInput}
              value={price}
              onChangeText={onPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={sw.priceCurrencyLabel}>USD</Text>
          </View>
          <Text style={sw.priceNote}>You can change this anytime.</Text>
        </View>
      )}

      <Text style={[sw.fieldLabel, { marginTop: spacing.lg }]}>Additional Options</Text>
      <ToggleRow label="Allow Comments" value={allowComments} onChange={onAllowComments} />
      <ToggleRow label="Allow Likes" value={allowLikes} onChange={onAllowLikes} />
      <ToggleRow label="Add to Showcase" value={addToShowcase} onChange={onAddToShowcase} />
      <ToggleRow label="Drop Content (Schedule)" value={dropContent} onChange={onDropContent} />
    </ScrollView>
  );
}

// ─── Preview & Settings Step ─────────────────────────────────────────────────

export function PreviewStep({
  previewType, onPreviewType,
  customStart, onCustomStart,
  customEnd, onCustomEnd,
  previewFileUri, onPickPreview,
  allowComments, onAllowComments,
  allowLikes, onAllowLikes,
  addToShowcase, onAddToShowcase,
  dropContent, onDropContent,
  previewThumbUri,
}: {
  previewType: PreviewType; onPreviewType: (v: PreviewType) => void;
  customStart: string; onCustomStart: (v: string) => void;
  customEnd: string; onCustomEnd: (v: string) => void;
  previewFileUri: string; onPickPreview: () => void;
  allowComments: boolean; onAllowComments: (v: boolean) => void;
  allowLikes: boolean; onAllowLikes: (v: boolean) => void;
  addToShowcase: boolean; onAddToShowcase: (v: boolean) => void;
  dropContent: boolean; onDropContent: (v: boolean) => void;
  previewThumbUri?: string;
}) {
  return (
    <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={sw.stepTitle}>Preview & Settings</Text>
      <Text style={sw.stepSub}>Set what viewers can preview and other settings.</Text>

      {previewThumbUri ? (
        <View style={sw.previewVideoBox}>
          <Image source={{ uri: previewThumbUri }} style={sw.previewVideoThumb} />
          <View style={sw.previewPlayBtn}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
      ) : null}

      <Text style={[sw.fieldLabel, { marginTop: spacing.md }]}>
        Preview Access <Text style={sw.hint}>(What viewers can see before paying)</Text>
      </Text>

      {PREVIEW_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={sw.previewOption}
          onPress={() => onPreviewType(opt.key)}
        >
          <View style={[sw.radioOuter, previewType === opt.key && sw.radioOuterActive]}>
            {previewType === opt.key && <View style={sw.radioInner} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sw.previewOptionLabel}>{opt.label}</Text>
            <Text style={sw.previewOptionDesc}>{opt.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {previewType === 'custom-range' && (
        <View style={sw.customRangeRow}>
          <View style={{ flex: 1 }}>
            <Text style={sw.fieldLabel}>Start (seconds)</Text>
            <TextInput style={sw.input} value={customStart} onChangeText={onCustomStart} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sw.fieldLabel}>End (seconds)</Text>
            <TextInput style={sw.input} value={customEnd} onChangeText={onCustomEnd} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
      )}

      {previewType === 'custom-upload' && (
        <TouchableOpacity style={sw.uploadPreviewBtn} onPress={onPickPreview}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={sw.uploadPreviewText}>
            {previewFileUri ? 'Preview video selected ✓' : 'Upload preview video'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[sw.fieldLabel, { marginTop: spacing.lg }]}>Additional Settings</Text>
      <ToggleRow label="Allow Comments" value={allowComments} onChange={onAllowComments} />
      <ToggleRow label="Allow Likes" value={allowLikes} onChange={onAllowLikes} />
      <ToggleRow label="Add to Showcase" value={addToShowcase} onChange={onAddToShowcase} />
      <ToggleRow label="Drop Content (Schedule)" value={dropContent} onChange={onDropContent} />
    </ScrollView>
  );
}

// ─── Publish Summary Step ─────────────────────────────────────────────────────

export function PublishStep({
  title, summaryRows, onPublish, onSaveDraft, loading,
}: {
  title: string;
  summaryRows: { label: string; value: string }[];
  onPublish: () => void;
  onSaveDraft: () => void;
  loading: boolean;
}) {
  return (
    <ScrollView contentContainerStyle={sw.stepContent}>
      <View style={sw.publishCheck}>
        <View style={sw.publishCheckCircle}>
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>
        <Text style={sw.publishReadyTitle}>Ready to Publish!</Text>
        <Text style={sw.publishReadySub}>Review your video details before publishing.</Text>
      </View>

      <Text style={sw.fieldLabel}>{title}</Text>
      <View style={sw.summaryCard}>
        {summaryRows.map(row => (
          <View key={row.label} style={sw.summaryRow}>
            <Text style={sw.summaryLabel}>{row.label}</Text>
            <Text style={sw.summaryValue} numberOfLines={2}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={sw.publishBtn} onPress={onPublish} disabled={loading}>
        <Text style={sw.publishBtnText}>{loading ? 'Publishing…' : 'Publish Video'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={sw.draftBtn} onPress={onSaveDraft} disabled={loading}>
        <Text style={sw.draftBtnText}>Save as Draft</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={sw.toggleRow}>
      <Text style={sw.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
    </View>
  );
}

// ─── Thumbnail Picker ─────────────────────────────────────────────────────────

export function ThumbnailPicker({ uri, onPick }: { uri: string; onPick: () => void }) {
  return (
    <View style={sw.field}>
      <Text style={sw.fieldLabel}>Thumbnail</Text>
      <TouchableOpacity style={sw.thumbBox} onPress={onPick}>
        {uri
          ? <Image source={{ uri }} style={sw.thumbImage} />
          : <>
            <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
            <Text style={sw.thumbHint}>JPG, PNG · 16:9 recommended</Text>
          </>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onPick}>
        <Text style={sw.changeThumbnailText}>Change Thumbnail</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const sw = StyleSheet.create({
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepDotDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepDotNum: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: colors.primary },

  // Content
  stepContent: { padding: spacing.lg, paddingBottom: 40 },
  stepTitle: { ...typography.h2, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.xs },
  stepSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.lg },

  // Nav
  navRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  backBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  nextBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Field
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 2 },

  // Dropdown
  dropdown: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 13, color: colors.textPrimary },

  // Modal sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.md },
  catRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catRowActive: { backgroundColor: '#FFF0E8' },
  catRowText: { fontSize: 13, color: colors.textPrimary },
  catRowTextActive: { color: colors.primary, fontWeight: '700' },

  // Monetization
  monetizationCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border },
  monetizationCardActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  monetizationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  monetizationIconActive: { backgroundColor: colors.primary },
  monetizationLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  monetizationLabelActive: { color: colors.primary },
  monetizationDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

  // Price
  priceRow: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.sm },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  priceCurrency: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginRight: spacing.sm },
  priceInput: { flex: 1, fontSize: 16, paddingVertical: spacing.md, color: colors.textPrimary },
  priceCurrencyLabel: { fontSize: 13, color: colors.textSecondary, marginLeft: spacing.sm },
  priceNote: { fontSize: 10, color: colors.textMuted, marginTop: spacing.xs },

  // Radio
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  // Preview
  previewVideoBox: { height: 180, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#111', marginBottom: spacing.md, alignItems: 'center', justifyContent: 'center' },
  previewVideoThumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  previewPlayBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  previewOption: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewOptionLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  previewOptionDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  customRangeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  uploadPreviewBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm },
  uploadPreviewText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  hint: { fontSize: 11, color: colors.textMuted, fontWeight: '400' },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },

  // Thumbnail
  thumbBox: { height: 130, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, overflow: 'hidden', backgroundColor: colors.card },
  thumbImage: { width: '100%', height: '100%' },
  thumbHint: { fontSize: 10, color: colors.textMuted },
  changeThumbnailText: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: spacing.xs },

  // Publish
  publishCheck: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  publishCheckCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  publishReadyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  publishReadySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  summaryCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { width: 110, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryValue: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  publishBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  draftBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
  draftBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
