import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { showcaseService, type ShowcaseSection, type ShowcaseItem, type ShowcaseItemType } from '../services/api/showcase.service';

type Props = NativeStackScreenProps<RootStackParamList, 'ShowcaseEditor'>;

export default function ShowcaseEditorScreen({ navigation }: Props) {
  const [sections, setSections] = useState<ShowcaseSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<ShowcaseSection | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemSectionId, setItemSectionId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    contentType: 'link' as ShowcaseItemType,
    actionUrl: '',
    description: '',
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const fetched = await showcaseService.getCurrentUserShowcase();
          setSections(fetched);
        } catch (e) {
          Alert.alert('Error', 'Could not load showcase sections');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    try {
      const created = await showcaseService.createSection({
        title: newSectionTitle,
        layout: 'grid',
        published: false,
        items: [],
      });
      setSections([...sections, created]);
      setNewSectionTitle('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Showcase section created!');
    } catch (e) {
      Alert.alert('Error', 'Could not create section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    Alert.alert('Delete Section', 'Are you sure? This will remove all items in this section.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await showcaseService.deleteSection(sectionId);
            setSections(sections.filter(s => s.id !== sectionId));
            Alert.alert('Success', 'Section deleted');
          } catch (e) {
            Alert.alert('Error', 'Could not delete section');
          }
        },
      },
    ]);
  };

  const handleTogglePublish = async (section: ShowcaseSection) => {
    try {
      const updated = await showcaseService.updateSection(section.id, { published: !section.published });
      setSections(sections.map(s => (s.id === section.id ? updated : s)));
    } catch (e) {
      Alert.alert('Error', 'Could not update section');
    }
  };

  const handleAddItem = async () => {
    if (!itemSectionId || !newItem.title.trim() || !newItem.actionUrl.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const item = await showcaseService.addItem(itemSectionId, {
        title: newItem.title,
        contentType: newItem.contentType,
        actionUrl: newItem.actionUrl,
        description: newItem.description,
        actionLabel: 'View',
        published: false,
      });
      
      setSections(sections.map(s => 
        s.id === itemSectionId 
          ? { ...s, items: [...s.items, item] }
          : s
      ));
      
      setNewItem({ title: '', contentType: 'link', actionUrl: '', description: '' });
      setShowAddItemModal(false);
      setItemSectionId(null);
      Alert.alert('Success', 'Item added to showcase');
    } catch (e) {
      Alert.alert('Error', 'Could not add item');
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    Alert.alert('Delete Item', 'Remove this item from showcase?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await showcaseService.deleteItem(itemId);
            setSections(sections.map(s =>
              s.id === sectionId
                ? { ...s, items: s.items.filter(i => i.id !== itemId) }
                : s
            ));
            Alert.alert('Success', 'Item deleted');
          } catch (e) {
            Alert.alert('Error', 'Could not delete item');
          }
        },
      },
    ]);
  };

  const handleToggleItemPublish = async (sectionId: string, item: ShowcaseItem) => {
    try {
      const updated = await showcaseService.updateItem(item.id, { published: !item.published });
      setSections(sections.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.map(i => (i.id === item.id ? updated : i)) }
          : s
      ));
    } catch (e) {
      Alert.alert('Error', 'Could not update item');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Showcase</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.centerContent}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Create Your Showcase</Text>
            <Text style={styles.emptyText}>
              Feature your best work on your profile. Create sections to organize your content.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={styles.primaryBtnText}>Add Section</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.id} style={[styles.sectionCard, shadow.soft]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionMeta}>
                    {section.items.length} items • {section.layout}
                  </Text>
                </View>
                <View style={styles.sectionActions}>
                  <TouchableOpacity
                    onPress={() => handleTogglePublish(section)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={section.published ? 'eye' : 'eye-off'}
                      size={18}
                      color={section.published ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteSection(section.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.macroProtein} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Items List */}
              {section.items.length > 0 && (
                <View style={styles.itemsList}>
                  {section.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.itemType}>{item.contentType}</Text>
                      </View>
                      <View style={styles.itemRowActions}>
                        <TouchableOpacity
                          onPress={() => handleToggleItemPublish(section.id, item)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={item.published ? 'eye' : 'eye-off'}
                            size={14}
                            color={item.published ? colors.primary : colors.textMuted}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteItem(section.id, item.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="close-circle" size={14} color={colors.macroProtein} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.sectionButtonsRow}>
                <TouchableOpacity
                  style={[styles.editBtn, styles.editBtnSmall]}
                  onPress={() => setEditingSection(section)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="pencil-outline" size={12} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit Section</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, styles.addItemBtn]}
                  onPress={() => {
                    setItemSectionId(section.id);
                    setShowAddItemModal(true);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add" size={12} color={colors.primary} />
                  <Text style={styles.editBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Section Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Section</Text>
            <TouchableOpacity onPress={handleCreateSection} disabled={!newSectionTitle.trim()}>
              <Text style={[styles.createText, !newSectionTitle.trim() && styles.createTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Section Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Featured Content, My Courses, Bestselling Products"
              placeholderTextColor={colors.textMuted}
              value={newSectionTitle}
              onChangeText={setNewSectionTitle}
              maxLength={50}
            />

            <View style={styles.suggestionsGrid}>
              {[
                'Featured Content',
                'My Courses',
                'Start Here',
                'Latest Videos',
                'Bestselling Products',
                'Join My Communities',
                'Recommended Resources',
              ].map(title => (
                <TouchableOpacity
                  key={title}
                  style={styles.suggestionChip}
                  onPress={() => setNewSectionTitle(title)}
                >
                  <Text style={styles.suggestionText}>{title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAddItemModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setShowAddItemModal(false); setItemSectionId(null); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Item</Text>
            <TouchableOpacity onPress={handleAddItem} disabled={!newItem.title.trim() || !newItem.actionUrl.trim()}>
              <Text style={[styles.createText, (!newItem.title.trim() || !newItem.actionUrl.trim()) && styles.createTextDisabled]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Item title"
              placeholderTextColor={colors.textMuted}
              value={newItem.title}
              onChangeText={(title) => setNewItem({ ...newItem, title })}
              maxLength={100}
            />

            <Text style={styles.label}>Content Type</Text>
            <View style={styles.contentTypeGrid}>
              {(['video', 'video-series', 'blog', 'blog-post', 'pdf', 'store', 'product', 'membership', 'link'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, newItem.contentType === type && styles.typeChipActive]}
                  onPress={() => setNewItem({ ...newItem, contentType: type })}
                >
                  <Text style={[styles.typeChipText, newItem.contentType === type && styles.typeChipTextActive]}>
                    {type.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={colors.textMuted}
              value={newItem.actionUrl}
              onChangeText={(actionUrl) => setNewItem({ ...newItem, actionUrl })}
              maxLength={500}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Brief description of this item"
              placeholderTextColor={colors.textMuted}
              value={newItem.description}
              onChangeText={(description) => setNewItem({ ...newItem, description })}
              multiline
              maxLength={200}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Section Modal */}
      {editingSection && (
        <SectionEditModal
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={async (updated) => {
            const result = await showcaseService.updateSection(editingSection.id, updated);
            setSections(sections.map(s => (s.id === editingSection.id ? result : s)));
            setEditingSection(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function SectionEditModal({
  section,
  onClose,
  onSave,
}: {
  section: ShowcaseSection;
  onClose: () => void;
  onSave: (updates: Partial<ShowcaseSection>) => Promise<void>;
}) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || '');
  const [layout, setLayout] = useState<'grid' | 'carousel' | 'list'>(section.layout);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title, description, layout });
      Alert.alert('Success', 'Section updated');
    } catch (e) {
      Alert.alert('Error', 'Could not save section');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Section</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.createText, !title.trim() && styles.createTextDisabled]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Section title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Add a description for this section"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <Text style={styles.label}>Layout</Text>
          <View style={styles.layoutGrid}>
            {(['grid', 'carousel', 'list'] as const).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.layoutCard, layout === l && styles.layoutCardActive]}
                onPress={() => setLayout(l)}
              >
                <Ionicons name={l === 'grid' ? 'grid' : l === 'carousel' ? 'albums' : 'list'} size={20} color={layout === l ? colors.primary : colors.textSecondary} />
                <Text style={[styles.layoutLabel, layout === l && styles.layoutLabelActive]}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  createText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  createTextDisabled: { color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centerContent: { alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: spacing.md },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 17, maxWidth: 280 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionInfo: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  sectionMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  sectionActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  itemsList: { gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  itemType: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  itemRowActions: { flexDirection: 'row', gap: spacing.md },
  sectionButtonsRow: { flexDirection: 'row', gap: spacing.md },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  editBtnSmall: { flex: 0.5 },
  addItemBtn: { flex: 0.5 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  suggestionText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  contentTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary },
  layoutGrid: { flexDirection: 'row', gap: spacing.md },
  layoutCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
  },
  layoutCardActive: { borderColor: colors.primary, backgroundColor: '#FFF6F1' },
  layoutLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  layoutLabelActive: { color: colors.primary },
});
