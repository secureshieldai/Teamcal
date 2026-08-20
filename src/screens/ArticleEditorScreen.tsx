import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Image, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { blogsService } from '../services/api/blogs.service';
import { postsService } from '../services/api/posts.service';
import { ARTICLE_CATEGORIES } from '../data/articleCategories';
import {
  articleMarkdownIt, articleMarkdownRules, articleMarkdownStyle, TEXT_COLOR_SWATCHES,
} from '../data/articleMarkdown';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleEditor'>;
type Selection = { start: number; end: number };
type SaveStatus = 'idle' | 'saving' | 'saved';
type UrlPromptTarget = 'link' | 'video' | null;

const TITLE_MAX = 120;

// ── Toolbar button ───────────────────────────────────────────────────────────
function ToolBtn({ onPress, children, disabled }: { onPress: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <TouchableOpacity style={tb.btn} onPress={onPress} disabled={disabled} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
      {children}
    </TouchableOpacity>
  );
}

function stripMarkdownForCount(text: string) {
  return text
    .replace(/\{\/?(color:#?[0-9a-fA-F]{3,8}|align:(left|center|right))\}|\{\/color\}|\{\/align\}/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~`=+\-]/g, ' ')
    .trim();
}

export default function ArticleEditorScreen({ route, navigation }: Props) {
  const { blogId, articleId: initialArticleId } = route.params;
  const [articleId, setArticleId] = useState(initialArticleId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cover, setCover] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [urlPromptFor, setUrlPromptFor] = useState<UrlPromptTarget>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [pendingSelection, setPendingSelection] = useState<Selection | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const bodyRef = useRef<TextInput>(null);
  const dirty = useRef(false);
  const loaded = useRef(!initialArticleId);
  const selectionRef = useRef<Selection>({ start: 0, end: 0 });

  // ── Load existing article ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialArticleId) return;
    blogsService.getArticle(initialArticleId).then((a) => {
      setTitle(a.title);
      setBody(a.body || '');
      setCover(a.cover || '');
      setCategory(a.category);
      setTags(a.tags || []);
      loaded.current = true;
    });
  }, [initialArticleId]);

  // ── Receive back params from child screens ─────────────────────────────────
  useEffect(() => {
    if (route.params.pickedCategory === undefined) return;
    setCategory(route.params.pickedCategory);
    dirty.current = true;
    navigation.setParams({ pickedCategory: undefined });
  }, [route.params.pickedCategory]);

  useEffect(() => {
    if (route.params.pickedTags === undefined) return;
    setTags(route.params.pickedTags);
    dirty.current = true;
    navigation.setParams({ pickedTags: undefined });
  }, [route.params.pickedTags]);

  useEffect(() => {
    if (route.params.insertText === undefined) return;
    insertAtCursor(route.params.insertText);
    navigation.setParams({ insertText: undefined });
  }, [route.params.insertText]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded.current || !dirty.current) return;
    if (!title.trim()) return;
    setSaveStatus('saving');
    const handle = setTimeout(async () => {
      try {
        const value = { blogId, title: title.trim(), body, cover: cover || undefined, category, tags, status: 'draft' };
        if (articleId) await blogsService.updateArticle(articleId, value);
        else {
          const created = await blogsService.createArticle(value);
          setArticleId(created.id);
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 2000);
    return () => clearTimeout(handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, cover, category, tags]);

  // ── Word count ─────────────────────────────────────────────────────────────
  const wordCount = useMemo(() => {
    const stripped = stripMarkdownForCount(body);
    return stripped ? stripped.split(/\s+/).length : 0;
  }, [body]);

  // ── Cursor helpers ─────────────────────────────────────────────────────────
  const moveCursorTo = (pos: number) => {
    const sel = { start: pos, end: pos };
    selectionRef.current = sel;
    setPendingSelection(sel);
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const { start, end } = selectionRef.current;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    dirty.current = true;
    moveCursorTo(start + before.length + selected.length + after.length);
    bodyRef.current?.focus();
  };

  const prefixLine = (marker: string) => {
    const { start } = selectionRef.current;
    const lineStart = body.lastIndexOf('\n', Math.max(start - 1, 0)) + 1;
    const next = body.slice(0, lineStart) + marker + body.slice(lineStart);
    setBody(next);
    dirty.current = true;
    moveCursorTo(start + marker.length);
    bodyRef.current?.focus();
  };

  function insertAtCursor(text: string) {
    const { start, end } = selectionRef.current;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    dirty.current = true;
    moveCursorTo(start + text.length);
    bodyRef.current?.focus();
  }

  const applyColor = (hex: string) => {
    wrapSelection(`{color:${hex}}`, '{/color}', 'colored text');
    setShowColorPicker(false);
  };

  // ── Cover image ────────────────────────────────────────────────────────────
  const pickCover = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!picked.canceled) {
      setBusy(true);
      try {
        setCover(await postsService.uploadImage({ uri: picked.assets[0].uri, mimeType: picked.assets[0].mimeType || 'image/jpeg', fileName: picked.assets[0].fileName || 'cover.jpg' }));
        dirty.current = true;
      } catch (e) {
        Alert.alert('Upload failed', (e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  };

  const insertImage = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (picked.canceled) return;
    setBusy(true);
    try {
      const url = await postsService.uploadImage({ uri: picked.assets[0].uri, mimeType: picked.assets[0].mimeType || 'image/jpeg', fileName: picked.assets[0].fileName || 'image.jpg' });
      insertAtCursor(`![](${url})`);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitUrlPrompt = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (urlPromptFor === 'link') {
      const { start, end } = selectionRef.current;
      const selected = body.slice(start, end) || 'link text';
      wrapSelection('[', `](${url})`, selected);
    } else if (urlPromptFor === 'video') {
      insertAtCursor(`[video](${url})`);
    }
    setUrlPromptFor(null);
    setUrlDraft('');
  };

  // ── Save / Publish ─────────────────────────────────────────────────────────
  const save = async (status: string) => {
    if (!title.trim()) return Alert.alert('Title required', 'Please add an article title before saving.');
    setBusy(true);
    try {
      const value = { blogId, title: title.trim(), body, cover: cover || undefined, category, tags, status };
      if (articleId) await blogsService.updateArticle(articleId, value);
      else {
        const created = await blogsService.createArticle(value);
        setArticleId(created.id);
      }
      Alert.alert(
        status === 'published' ? 'Published!' : 'Draft saved',
        status === 'published' ? 'Your article is now live.' : 'Your draft has been saved.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const categoryLabel = ARTICLE_CATEGORIES.find((c) => c.id === category)?.label;
  const categoryIcon = ARTICLE_CATEGORIES.find((c) => c.id === category)?.icon ?? 'pricetag-outline';

  // ── Save status label ──────────────────────────────────────────────────────
  const saveLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved just now' : '';
  const savedOk = saveStatus === 'saved';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Article</Text>
        <TouchableOpacity disabled={busy} onPress={() => save('draft')}>
          <Text style={s.draftLink}>Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <View style={s.titleWrap}>
          <TextInput
            style={s.titleInput}
            value={title}
            onChangeText={(t) => { setTitle(t.slice(0, TITLE_MAX)); dirty.current = true; }}
            placeholder="Enter article title..."
            placeholderTextColor={colors.textMuted}
            maxLength={TITLE_MAX}
          />
          <Text style={s.titleCounter}>{title.length}/{TITLE_MAX}</Text>
        </View>

        {/* ── Cover image ── */}
        {cover ? (
          <TouchableOpacity onPress={pickCover} disabled={busy} activeOpacity={0.88}>
            <Image source={{ uri: cover }} style={s.coverImage} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.coverUpload} onPress={pickCover} disabled={busy} activeOpacity={0.88}>
            <Ionicons name="image-outline" size={22} color={colors.primary} />
            <View>
              <Text style={s.coverUploadLabel}>Upload cover image</Text>
              <Text style={s.coverUploadSub}>Recommended size: 1200 x 630px</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Toolbar ── */}
        <View style={[s.toolbarCard, shadow.soft]}>
          {/* Row 1 — H1 H2 | B I U S | list bullet list numbered quote link */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.toolbarRowScroll}
            contentContainerStyle={s.toolbarRowContent}
            keyboardShouldPersistTaps="always"
          >
            <ToolBtn onPress={() => prefixLine('# ')}><Text style={s.toolText}>H1</Text></ToolBtn>
            <ToolBtn onPress={() => prefixLine('## ')}><Text style={s.toolText}>H2</Text></ToolBtn>
            <View style={s.toolDivider} />
            <ToolBtn onPress={() => wrapSelection('**', '**', 'bold text')}>
              <MaterialCommunityIcons name="format-bold" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('_', '_', 'italic text')}>
              <MaterialCommunityIcons name="format-italic" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('++', '++', 'underlined text')}>
              <MaterialCommunityIcons name="format-underline" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('~~', '~~', 'strikethrough')}>
              <MaterialCommunityIcons name="format-strikethrough" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <View style={s.toolDivider} />
            <ToolBtn onPress={() => prefixLine('- ')}>
              <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => prefixLine('1. ')}>
              <MaterialCommunityIcons name="format-list-numbered" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => prefixLine('> ')}>
              <MaterialCommunityIcons name="format-quote-close" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => { setUrlDraft(''); setUrlPromptFor('link'); }}>
              <MaterialCommunityIcons name="link-variant" size={18} color={colors.textPrimary} />
            </ToolBtn>
          </ScrollView>

          <View style={s.toolbarSeparator} />

          {/* Row 2 — color highlight | align left center right | image video code */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.toolbarRowScroll}
            contentContainerStyle={s.toolbarRowContent}
            keyboardShouldPersistTaps="always"
          >
            <ToolBtn onPress={() => setShowColorPicker((v) => !v)}>
              <MaterialCommunityIcons name="format-color-text" size={18} color={showColorPicker ? colors.primary : colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('==', '==', 'highlighted')}>
              <MaterialCommunityIcons name="format-color-highlight" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <View style={s.toolDivider} />
            <ToolBtn onPress={() => wrapSelection('{align:left}\n', '\n{/align}', 'text')}>
              <MaterialCommunityIcons name="format-align-left" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('{align:center}\n', '\n{/align}', 'text')}>
              <MaterialCommunityIcons name="format-align-center" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('{align:right}\n', '\n{/align}', 'text')}>
              <MaterialCommunityIcons name="format-align-right" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <View style={s.toolDivider} />
            <ToolBtn onPress={insertImage} disabled={busy}>
              <MaterialCommunityIcons name="image-plus" size={18} color={busy ? colors.textMuted : colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => { setUrlDraft(''); setUrlPromptFor('video'); }}>
              <MaterialCommunityIcons name="video-plus" size={18} color={colors.textPrimary} />
            </ToolBtn>
            <ToolBtn onPress={() => wrapSelection('\n```\n', '\n```\n', 'code here')}>
              <MaterialCommunityIcons name="code-tags" size={18} color={colors.textPrimary} />
            </ToolBtn>
          </ScrollView>

          {/* Color picker — expands below row 2 when active */}
          {showColorPicker && (
            <View style={s.colorRow}>
              {TEXT_COLOR_SWATCHES.map((hex) => (
                <TouchableOpacity key={hex} style={[s.swatch, { backgroundColor: hex }]} onPress={() => applyColor(hex)} />
              ))}
            </View>
          )}
        </View>

        {/* ── Writing area ── */}
        <View style={s.bodyWrap}>
          <TextInput
            ref={bodyRef}
            style={s.bodyInput}
            value={body}
            onChangeText={(t) => { setBody(t); dirty.current = true; }}
            onSelectionChange={(e) => {
              selectionRef.current = e.nativeEvent.selection;
              if (pendingSelection) setPendingSelection(undefined);
            }}
            selection={pendingSelection}
            placeholder="Write your article..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          {/* AI Helper button — top-right inside writing area */}
          <TouchableOpacity
            style={s.aiHelperBtn}
            onPress={() => navigation.navigate('AIHelper', { blogId, articleId, existingContent: body })}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={13} color="#7C5CFC" />
            <Text style={s.aiHelperText}>AI Helper</Text>
          </TouchableOpacity>
        </View>

        {/* ── Word count + auto-save ── */}
        <View style={s.statusRow}>
          <Text style={s.statusWords}>Words: {wordCount}</Text>
          {saveLabel ? (
            <View style={s.statusSaved}>
              <Text style={s.statusSavedText}>{saveLabel}</Text>
              {savedOk && <Ionicons name="checkmark" size={14} color={colors.success} />}
            </View>
          ) : null}
        </View>

        {/* ── Category + Tags row (single horizontal card) ── */}
        <View style={[s.metaCard, shadow.soft]}>
          <TouchableOpacity
            style={s.metaItem}
            onPress={() => navigation.navigate('SelectCategory', { blogId, articleId, current: category })}
            activeOpacity={0.8}
          >
            <View style={s.metaIconBg}>
              <Ionicons name={categoryIcon as never} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.metaLabel}>Select Category</Text>
              <Text style={s.metaValue} numberOfLines={1}>{categoryLabel || 'Choose a category'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={s.metaDivider} />

          <TouchableOpacity
            style={s.metaItem}
            onPress={() => navigation.navigate('AddTags', { blogId, articleId, current: tags })}
            activeOpacity={0.8}
          >
            <View style={s.metaIconBg}>
              <Ionicons name="pricetags-outline" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.metaLabel}>Add Tags</Text>
              <Text style={s.metaValue} numberOfLines={1}>{tags.length ? `${tags.length} tag${tags.length > 1 ? 's' : ''} added` : 'Add up to 30 tags'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Bottom action bar ── */}
        <View style={s.actionBar}>
          {/* Left icon buttons */}
          <View style={s.actionIcons}>
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowPreview(true)}>
              <Ionicons name="eye-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => save('draft')} disabled={busy}>
              <Ionicons name="folder-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => Alert.alert('Delete draft?', 'This will discard all unsaved changes.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
              ])}
            >
              <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Right: Save as Draft + Publish */}
          <View style={s.actionBtns}>
            <TouchableOpacity style={s.saveDraftBtn} disabled={busy} onPress={() => save('draft')} activeOpacity={0.88}>
              <Text style={s.saveDraftText}>Save as draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.publishBtn} disabled={busy} onPress={() => save('published')} activeOpacity={0.88}>
              <Text style={s.publishText}>{busy ? 'Saving…' : 'Publish'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── URL prompt modal ── */}
      <Modal visible={!!urlPromptFor} transparent animationType="fade" onRequestClose={() => setUrlPromptFor(null)}>
        <View style={s.modalBackdrop}>
          <View style={s.promptCard}>
            <Text style={s.promptTitle}>{urlPromptFor === 'video' ? 'Video URL' : 'Link URL'}</Text>
            <TextInput
              style={s.promptInput}
              value={urlDraft}
              onChangeText={setUrlDraft}
              placeholder="https://…"
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={s.promptActions}>
              <TouchableOpacity style={s.promptCancel} onPress={() => setUrlPromptFor(null)}>
                <Text style={s.promptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.promptSubmit} onPress={submitUrlPrompt} disabled={!urlDraft.trim()}>
                <Text style={s.promptSubmitText}>Insert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Preview modal ── */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <SafeAreaView style={s.safe} edges={['top']}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowPreview(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Preview</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView contentContainerStyle={s.previewContent}>
            {cover ? <Image source={{ uri: cover }} style={s.previewCover} /> : null}
            <Text style={s.previewTitle}>{title || 'Untitled article'}</Text>
            <Markdown markdownit={articleMarkdownIt} rules={articleMarkdownRules} style={articleMarkdownStyle}>
              {body}
            </Markdown>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Toolbar button styles (shared) ──────────────────────────────────────────
const tb = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  draftLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  scroll: { paddingBottom: 32 },

  // Title
  titleWrap: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.textPrimary,
    minHeight: 44,
  },
  titleCounter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: colors.textMuted,
  },

  // Cover
  coverUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  coverUploadLabel: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  coverUploadSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  coverImage: { width: '100%', height: 160, backgroundColor: colors.border },

  // Toolbar
  toolbarCard: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  toolbarRowScroll: {
    height: 38,
  },
  toolbarRowContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 1,
  },
  toolbarSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  toolText: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  toolDivider: { width: 1, height: 18, backgroundColor: colors.border, marginHorizontal: 3 },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.border },

  // Writing area
  bodyWrap: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: 240,
    position: 'relative',
  },
  bodyInput: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 48,          // leave room for AI button
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textPrimary,
    minHeight: 240,
    textAlignVertical: 'top',
  },
  aiHelperBtn: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D6CCFC',
  },
  aiHelperText: { fontSize: 12.5, fontWeight: '800', color: '#7C5CFC' },

  // Status row
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusWords: { fontSize: 12, color: colors.textMuted },
  statusSaved: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusSavedText: { fontSize: 12, color: colors.textMuted },

  // Meta card (Category + Tags side by side)
  metaCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  metaDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  metaIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  metaValue: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  actionIcons: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  actionBtns: { flexDirection: 'row', gap: spacing.sm },
  saveDraftBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  saveDraftText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  publishBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  publishText: { fontSize: 13, fontWeight: '800', color: colors.white },

  // URL prompt
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  promptCard: { width: '100%', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  promptTitle: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  promptInput: { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, fontSize: 13.5, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  promptActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  promptCancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  promptCancelText: { color: colors.textSecondary, fontWeight: '700' },
  promptSubmit: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  promptSubmitText: { color: colors.white, fontWeight: '700' },

  // Preview modal
  previewContent: { padding: spacing.lg, gap: spacing.md },
  previewCover: { width: '100%', height: 180, borderRadius: radii.lg },
  previewTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
});
