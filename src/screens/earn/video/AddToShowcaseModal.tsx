import React, { useState, useEffect } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, shadow, spacing, typography } from '../../../theme';
import { showcaseService, type ShowcaseSection } from '../../../services/api/showcase.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (config: AddToShowcaseConfig) => void;
}

export interface AddToShowcaseConfig {
  enabled: boolean;
  sectionId?: string;
  newSectionTitle?: string;
  coverImage?: string;
  description?: string;
  position?: 'beginning' | 'end';
  layout?: 'grid' | 'carousel' | 'list';
  publishMode?: 'immediately' | 'scheduled' | 'hidden';
  publishAfter?: string;
}

export default function AddToShowcaseModal({ visible, onClose, onConfirm }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [sections, setSections] = useState<ShowcaseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<'beginning' | 'end'>('end');
  const [layout, setLayout] = useState<'grid' | 'carousel' | 'list'>('grid');
  const [publishMode, setPublishMode] = useState<'immediately' | 'scheduled' | 'hidden'>('immediately');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && enabled) {
      loadSections();
    }
  }, [visible, enabled]);

  const loadSections = async () => {
    try {
      const fetched = await showcaseService.getCurrentUserShowcase();
      setSections(fetched);
    } catch (e) {
      Alert.alert('Error loading sections', (e as Error).message);
    }
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled) setCoverImage(result.assets[0].uri);
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    setLoading(true);
    try {
      const created = await showcaseService.createSection({
        title: newSectionTitle,
        layout,
        published: false,
        items: [],
      });
      setSections([...sections, created]);
      setSelectedSection(created.id);
      setIsCreatingSection(false);
      setNewSectionTitle('');
      Alert.alert('Success', 'Section created!');
    } catch (e) {
      Alert.alert('Error', 'Could not create section');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (enabled && !selectedSection && !newSectionTitle.trim()) {
      Alert.alert('Error', 'Please select or create a showcase section');
      return;
    }

    if (publishMode === 'scheduled' && !publishDate) {
      Alert.alert('Error', 'Please select a publication date');
      return;
    }

    const config: AddToShowcaseConfig = {
      enabled,
      sectionId: selectedSection || undefined,
      newSectionTitle: newSectionTitle || undefined,
      coverImage: coverImage || undefined,
      description,
      position,
      layout,
      publishMode,
      publishAfter: publishMode === 'scheduled' ? `${publishDate}T${publishTime || '00:00'}` : undefined,
    };

    onConfirm(config);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add to Showcase</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[s.doneText, !enabled && s.doneTextDisabled]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Enable Showcase</Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
            <Text style={s.sectionDesc}>
              Add this series to your profile showcase to feature it prominently to visitors.
            </Text>
          </View>

          {enabled && (
            <>
              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Choose Section</Text>

                {isCreatingSection ? (
                  <View>
                    <TextInput
                      style={s.input}
                      placeholder="e.g., My Courses, Featured Content"
                      placeholderTextColor={colors.textMuted}
                      value={newSectionTitle}
                      onChangeText={setNewSectionTitle}
                      maxLength={50}
                    />
                    <View style={s.buttonRow}>
                      <TouchableOpacity
                        style={[s.btn, s.btnSecondary]}
                        onPress={() => { setIsCreatingSection(false); setNewSectionTitle(''); }}
                      >
                        <Text style={s.btnSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.btn, s.btnPrimary]}
                        onPress={handleCreateSection}
                        disabled={loading}
                      >
                        <Text style={s.btnPrimaryText}>{loading ? 'Creating...' : 'Create'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {sections.length > 0 && (
                      <View style={s.sectionsList}>
                        {sections.map(sec => (
                          <TouchableOpacity
                            key={sec.id}
                            style={[s.sectionItem, selectedSection === sec.id && s.sectionItemActive]}
                            onPress={() => setSelectedSection(sec.id)}
                          >
                            <View style={s.radioOuter}>
                              {selectedSection === sec.id && <View style={s.radioInner} />}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.sectionItemTitle}>{sec.title}</Text>
                              <Text style={s.sectionItemMeta}>{sec.items.length} items</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity
                      style={s.createNewBtn}
                      onPress={() => setIsCreatingSection(true)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                      <Text style={s.createNewBtnText}>Create New Section</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Appearance</Text>

                <Text style={s.label}>Cover Image (16:9 aspect ratio)</Text>
                <TouchableOpacity style={s.thumbBox} onPress={pickCoverImage}>
                  {coverImage
                    ? <Ionicons name="image" size={24} color={colors.success} />
                    : <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />}
                  <Text style={s.thumbText}>
                    {coverImage ? 'Image selected ✓' : 'Tap to upload cover image'}
                  </Text>
                </TouchableOpacity>

                <Text style={s.label}>Description (Optional)</Text>
                <TextInput
                  style={[s.input, { minHeight: 70 }]}
                  placeholder="Add a short description for this series"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={150}
                />

                <Text style={s.label}>Position</Text>
                <View style={s.rowButtons}>
                  {(['beginning', 'end'] as const).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.smallBtn, position === p && s.smallBtnActive]}
                      onPress={() => setPosition(p)}
                    >
                      <Text style={[s.smallBtnText, position === p && s.smallBtnTextActive]}>
                        {p === 'beginning' ? 'First' : 'Last'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>Layout</Text>
                <View style={s.layoutRow}>
                  {(['grid', 'carousel', 'list'] as const).map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[s.layoutBtn, layout === l && s.layoutBtnActive]}
                      onPress={() => setLayout(l)}
                    >
                      <Ionicons
                        name={l === 'grid' ? 'grid' : l === 'carousel' ? 'albums' : 'list'}
                        size={18}
                        color={layout === l ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[s.layoutBtnText, layout === l && s.layoutBtnTextActive]}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>When Should It Appear?</Text>

                {(['immediately', 'scheduled', 'hidden'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={s.publishOption}
                    onPress={() => setPublishMode(mode)}
                  >
                    <View style={[s.radioOuter, publishMode === mode && s.radioOuterActive]}>
                      {publishMode === mode && <View style={s.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.publishOptionLabel}>
                        {mode === 'immediately' ? 'Immediately after series publishes' : mode === 'scheduled' ? 'On a specific date' : 'Keep hidden until I publish it'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {publishMode === 'scheduled' && (
                  <View style={s.dateTimeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Date</Text>
                      <TextInput
                        style={s.input}
                        placeholder="YYYY-MM-DD"
                        value={publishDate}
                        onChangeText={setPublishDate}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Time</Text>
                      <TextInput
                        style={s.input}
                        placeholder="HH:MM"
                        value={publishTime}
                        onChangeText={setPublishTime}
                      />
                    </View>
                  </View>
                )}
              </View>

              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Preview</Text>
                <View style={s.preview}>
                  {coverImage && <Ionicons name="image" size={32} color={colors.primary} />}
                  <Text style={s.previewTitle} numberOfLines={2}>Your Series Title</Text>
                  {description && <Text style={s.previewDesc} numberOfLines={2}>{description}</Text>}
                  <TouchableOpacity style={s.previewAction}>
                    <Text style={s.previewActionText}>Watch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  headerTitle: { ...typography.h2, fontSize: 16 },
  doneText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  doneTextDisabled: { color: colors.textMuted, opacity: 0.5 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  sectionDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: spacing.xs },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.pill, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnSecondary: { borderWidth: 1, borderColor: colors.primary },
  btnSecondaryText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  sectionsList: { gap: spacing.sm, marginBottom: spacing.md },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  sectionItemActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  sectionItemTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  sectionItemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  createNewBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.lg, padding: spacing.md, backgroundColor: '#FFF8F5' },
  createNewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  thumbBox: { height: 90, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.background, marginBottom: spacing.md },
  thumbText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  rowButtons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  smallBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, alignItems: 'center' },
  smallBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  smallBtnTextActive: { color: colors.primary },
  layoutRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  layoutBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, alignItems: 'center', gap: spacing.xs },
  layoutBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  layoutBtnText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  layoutBtnTextActive: { color: colors.primary },
  publishOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  publishOptionLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  dateTimeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  preview: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  previewTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  previewDesc: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  previewAction: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  previewActionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
