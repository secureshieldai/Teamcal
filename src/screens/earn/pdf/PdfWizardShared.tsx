import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing, typography } from '../../../theme';
import { PDF_CATEGORIES, BUYER_PREVIEW_OPTIONS, AI_QUICK_ACTIONS, type BuyerPreviewType, type Chapter } from './pdfData';
import { coachService } from '../../../services/api/coach.service';

// ─── Step Bar ──────────────────────────────────────────────────────────────────

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={ps.stepBar}>
      {steps.map((label, i) => (
        <View key={label} style={ps.stepItem}>
          <View style={[ps.stepDot, i < current && ps.stepDotDone, i === current && ps.stepDotActive]}>
            {i < current
              ? <Ionicons name="checkmark" size={10} color="#fff" />
              : <Text style={[ps.stepNum, i === current && { color: '#fff' }]}>{i + 1}</Text>}
          </View>
          {i < steps.length - 1 && <View style={[ps.stepLine, i < current && ps.stepLineDone]} />}
        </View>
      ))}
    </View>
  );
}

// ─── Wizard Header ─────────────────────────────────────────────────────────────

export function WizardHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={ps.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={ps.headerTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ─── Nav Buttons ───────────────────────────────────────────────────────────────

export function WizardNav({
  onBack, onNext, nextLabel = 'Next', nextDisabled = false, loading = false,
}: {
  onBack?: () => void; onNext: () => void;
  nextLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <View style={ps.navRow}>
      {onBack
        ? <TouchableOpacity style={ps.backBtn} onPress={onBack}><Text style={ps.backBtnText}>Back</Text></TouchableOpacity>
        : <View style={{ flex: 1 }} />}
      <TouchableOpacity style={[ps.nextBtn, nextDisabled && ps.nextBtnDisabled]} onPress={onNext} disabled={nextDisabled || loading}>
        <Text style={ps.nextBtnText}>{loading ? 'Saving…' : nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────

export function Field({
  label, value, onChangeText, placeholder, multiline, maxLength, required, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; maxLength?: number;
  required?: boolean; keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={ps.field}>
      <Text style={ps.fieldLabel}>{label}{required && <Text style={{ color: colors.primary }}> *</Text>}</Text>
      <TextInput
        style={[ps.input, multiline && ps.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType ?? 'default'}
      />
      {maxLength && <Text style={ps.charCount}>{value.length}/{maxLength}</Text>}
    </View>
  );
}

// ─── Category Dropdown ─────────────────────────────────────────────────────────

export function CategoryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={ps.field}>
      <Text style={ps.fieldLabel}>Category <Text style={{ color: colors.primary }}>*</Text></Text>
      <TouchableOpacity style={ps.dropdown} onPress={() => setOpen(true)}>
        <Text style={[ps.dropdownText, !value && { color: colors.textMuted }]}>{value || 'Select category'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={ps.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={ps.modalSheet}>
            <View style={ps.modalHandle} />
            <Text style={ps.modalTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PDF_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[ps.listRow, value === cat && ps.listRowActive]}
                  onPress={() => { onChange(cat); setOpen(false); }}
                >
                  <Text style={[ps.listRowText, value === cat && ps.listRowTextActive]}>{cat}</Text>
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

// ─── Buyer Preview Settings ────────────────────────────────────────────────────

export function BuyerPreviewSettings({
  previewType, onPreviewType,
  previewPages, onPreviewPages,
  specificPages, onSpecificPages,
  customContent, onCustomContent,
}: {
  previewType: BuyerPreviewType; onPreviewType: (v: BuyerPreviewType) => void;
  previewPages: string; onPreviewPages: (v: string) => void;
  specificPages: string; onSpecificPages: (v: string) => void;
  customContent: string; onCustomContent: (v: string) => void;
}) {
  return (
    <View>
      <Text style={ps.fieldLabel}>
        Buyer Preview <Text style={ps.hint}>(What buyers can see before purchasing)</Text>
      </Text>
      {BUYER_PREVIEW_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={ps.previewOption}
          onPress={() => onPreviewType(opt.key)}
        >
          <View style={[ps.radio, previewType === opt.key && ps.radioActive]}>
            {previewType === opt.key && <View style={ps.radioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.previewOptLabel}>{opt.label}</Text>
            <Text style={ps.previewOptDesc}>{opt.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {previewType === 'first-pages' && (
        <View style={ps.previewExtra}>
          <Text style={ps.fieldLabel}>Number of pages</Text>
          <View style={ps.pageCountRow}>
            <TextInput
              style={[ps.input, { width: 80, textAlign: 'center' }]}
              value={previewPages}
              onChangeText={onPreviewPages}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={ps.pageCountLabel}>pages</Text>
          </View>
          <Text style={ps.previewNote}>
            Buyers will be able to preview the first {previewPages || '5'} pages before purchasing.
          </Text>
        </View>
      )}

      {previewType === 'specific-pages' && (
        <View style={ps.previewExtra}>
          <Field label="Page numbers (e.g. 1, 3, 5-10)" value={specificPages} onChangeText={onSpecificPages} placeholder="1, 3, 5-10" />
        </View>
      )}

      {previewType === 'custom-content' && (
        <View style={ps.previewExtra}>
          <Field label="Custom preview content" value={customContent} onChangeText={onCustomContent} multiline placeholder="Write or paste preview content here…" maxLength={2000} />
        </View>
      )}
    </View>
  );
}

// ─── Chapter Editor ────────────────────────────────────────────────────────────

type ChapterEditorProps = {
  chapter: Chapter;
  onSave: (ch: Chapter) => void;
  onCancel: () => void;
};

export function ChapterEditor({ chapter, onSave, onCancel }: ChapterEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [images, setImages] = useState<string[]>(chapter.images);
  const [showAI, setShowAI] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const insert = (prefix: string, suffix = '') => {
    const insertion = `${prefix}text${suffix}`;
    setContent(c => c + (c.endsWith('\n') || !c ? '' : '\n') + insertion + '\n');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setImages(prev => [...prev, uri]);
    setContent(c => c + `\n![image](${uri})\n`);
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Title required'); return; }
    onSave({ ...chapter, title: title.trim(), content, images });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={ps.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={ps.headerTitle}>Add Chapter</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Write / Preview Tabs */}
      <View style={ps.chapterTabRow}>
        <TouchableOpacity style={[ps.chapterTab, tab === 'write' && ps.chapterTabActive]} onPress={() => setTab('write')}>
          <Text style={[ps.chapterTabText, tab === 'write' && ps.chapterTabTextActive]}>Write</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ps.chapterTab, tab === 'preview' && ps.chapterTabActive]} onPress={() => setTab('preview')}>
          <Text style={[ps.chapterTabText, tab === 'preview' && ps.chapterTabTextActive]}>Preview</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">

          {tab === 'write' ? (
            <>
              {/* Title */}
              <Text style={ps.fieldLabel}>Chapter Title <Text style={{ color: colors.primary }}>*</Text></Text>
              <TextInput
                style={ps.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter chapter title"
                placeholderTextColor={colors.textMuted}
                maxLength={150}
              />
              <Text style={ps.charCount}>{title.length}/150</Text>

              {/* Toolbar */}
              <Text style={[ps.fieldLabel, { marginTop: spacing.md }]}>Chapter Content</Text>
              <View style={ps.toolbar}>
                <View style={ps.toolbarRow}>
                  <ToolBtn label="H₁" onPress={() => insert('# ')} />
                  <ToolBtn label="H₂" onPress={() => insert('## ')} />
                  <ToolBtn label="H₃" onPress={() => insert('### ')} />
                  <ToolBtn label="B" bold onPress={() => insert('**', '**')} />
                  <ToolBtn label="I" italic onPress={() => insert('_', '_')} />
                  <ToolBtn label="U" underline onPress={() => insert('<u>', '</u>')} />
                  <ToolIconBtn name="list-outline" onPress={() => insert('- ')} />
                  <ToolIconBtn name="list" onPress={() => insert('1. ')} />
                </View>
                <View style={ps.toolbarRow}>
                  <ToolIconBtn name="link-outline" onPress={() => insert('[link text](', ')')} />
                  <ToolIconBtn name="code-outline" onPress={() => insert('`', '`')} />
                  <ToolIconBtn name="reorder-four-outline" onPress={() => insert('> ')} />
                  <ToolIconBtn name="remove-outline" onPress={() => insert('\n---\n')} />
                  <ToolIconBtn name="image-outline" onPress={pickImage} />
                </View>
              </View>

              {/* Content editor */}
              <View style={ps.editorBox}>
                <TextInput
                  style={ps.editor}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Start writing your chapter content here…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
                {images.map((uri, i) => (
                  <View key={i} style={ps.editorImage}>
                    <Image source={{ uri }} style={ps.editorImageThumb} />
                    <TouchableOpacity
                      style={ps.editorImageRemove}
                      onPress={() => {
                        setImages(prev => prev.filter((_, j) => j !== i));
                        setContent(c => c.replace(`\n![image](${uri})\n`, ''));
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <Text style={ps.wordCount}>{wordCount} words</Text>
              </View>
            </>
          ) : (
            /* Preview tab */
            <View style={ps.previewBox}>
              <Text style={ps.previewTitle}>{title || 'Chapter Title'}</Text>
              <Text style={ps.previewContent}>{content || 'Your chapter content will appear here.'}</Text>
              {images.map((uri, i) => <Image key={i} source={{ uri }} style={ps.previewImageFull} />)}
            </View>
          )}

          {/* AI Assist button */}
          <TouchableOpacity style={ps.aiAssistBtn} onPress={() => setShowAI(true)}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={ps.aiAssistBtnText}>AI Assist</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom actions */}
      <View style={ps.navRow}>
        <TouchableOpacity style={ps.backBtn} onPress={onCancel}>
          <Text style={ps.backBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ps.nextBtn} onPress={handleSave}>
          <Text style={ps.nextBtnText}>Save Chapter</Text>
        </TouchableOpacity>
      </View>

      {/* AI Assist Modal */}
      <AiAssistModal
        visible={showAI}
        onClose={() => setShowAI(false)}
        onInsert={text => { setContent(c => c + '\n' + text); setShowAI(false); }}
        context={title}
      />
    </View>
  );
}

// ─── Toolbar helpers ───────────────────────────────────────────────────────────

function ToolBtn({ label, onPress, bold, italic, underline }: { label: string; onPress: () => void; bold?: boolean; italic?: boolean; underline?: boolean }) {
  return (
    <TouchableOpacity style={ps.toolBtn} onPress={onPress}>
      <Text style={[ps.toolBtnText, bold && { fontWeight: '900' }, italic && { fontStyle: 'italic' }, underline && { textDecorationLine: 'underline' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToolIconBtn({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={ps.toolBtn} onPress={onPress}>
      <Ionicons name={name as any} size={16} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

// ─── AI Assist Modal ───────────────────────────────────────────────────────────

type AiMessage = { role: 'user' | 'ai'; text: string };

export function AiAssistModal({
  visible, onClose, onInsert, context,
}: {
  visible: boolean; onClose: () => void;
  onInsert: (text: string) => void;
  context?: string;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: AiMessage = { role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const result = await coachService.generateArticleContent({ action: 'write', topic: context || 'PDF content', instructions: prompt });
      const aiText = result.text || (Array.isArray(result.titles) ? result.titles.join('\n') : 'Here is your content.');
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not generate content right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ps.aiModal}>
        {/* Header */}
        <View style={ps.aiHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <View style={ps.aiHeaderTitleRow}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={ps.aiHeaderTitle}>AI Assist</Text>
            </View>
            <Text style={ps.aiHeaderSub}>For PDF Creation</Text>
          </View>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={ps.aiContent} showsVerticalScrollIndicator={false}>
          {!hasMessages ? (
            <>
              {/* Welcome */}
              <View style={ps.aiWelcome}>
                <View style={ps.aiWelcomeIcon}>
                  <Ionicons name="sparkles" size={28} color="#8B5CF6" />
                </View>
                <Text style={ps.aiWelcomeTitle}>Hi! I'm your AI writing assistant for PDFs</Text>
                <Text style={ps.aiWelcomeSub}>I can help you write, edit, organize content, generate images, and more for your PDF.</Text>
              </View>

              <Text style={ps.aiSectionLabel}>Get started</Text>
              <View style={ps.aiActionsGrid}>
                {AI_QUICK_ACTIONS.map(action => (
                  <TouchableOpacity
                    key={action.key}
                    style={ps.aiActionCard}
                    onPress={() => send(action.label)}
                  >
                    <View style={[ps.aiActionIcon, { backgroundColor: action.color + '20' }]}>
                      <Ionicons name={action.icon as any} size={20} color={action.color} />
                    </View>
                    <Text style={ps.aiActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={ps.aiOrText}>Or ask me anything about your PDF</Text>

              {/* Empty state */}
              <View style={ps.aiEmptyState}>
                <View style={ps.aiEmptyDots}>
                  <View style={ps.aiDot} /><View style={ps.aiDot} /><View style={ps.aiDot} />
                </View>
                <Text style={ps.aiEmptyTitle}>What do you want help{'\n'}with in your PDF?</Text>
                <Text style={ps.aiEmptySub}>Ask me anything and I'll help you{'\n'}create amazing PDF content.</Text>
              </View>
            </>
          ) : (
            /* Chat messages */
            messages.map((msg, i) => (
              <View key={i} style={msg.role === 'user' ? ps.aiMsgUser : ps.aiMsgAi}>
                {msg.role === 'ai' && (
                  <View style={ps.aiMsgAiIcon}>
                    <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                  </View>
                )}
                <View style={[ps.aiMsgBubble, msg.role === 'user' ? ps.aiMsgBubbleUser : ps.aiMsgBubbleAi]}>
                  <Text style={[ps.aiMsgText, msg.role === 'user' && { color: '#fff' }]}>{msg.text}</Text>
                  {msg.role === 'ai' && (
                    <TouchableOpacity style={ps.aiInsertBtn} onPress={() => onInsert(msg.text)}>
                      <Text style={ps.aiInsertBtnText}>Insert into chapter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={ps.aiMsgAi}>
              <View style={ps.aiMsgAiIcon}><Ionicons name="sparkles" size={14} color="#8B5CF6" /></View>
              <View style={[ps.aiMsgBubble, ps.aiMsgBubbleAi]}>
                <Text style={ps.aiMsgText}>Generating…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={ps.aiInputBar}>
            <TouchableOpacity style={ps.aiInputIcon}>
              <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={ps.aiInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type your message…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity style={ps.aiInputIcon}>
              <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[ps.aiSendBtn, !input.trim() && ps.aiSendBtnDisabled]}
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Thumbnail Picker ──────────────────────────────────────────────────────────

export function CoverPicker({ uri, onPick }: { uri: string; onPick: () => void }) {
  return (
    <View style={ps.field}>
      <Text style={ps.fieldLabel}>Cover Image</Text>
      <TouchableOpacity style={ps.coverBox} onPress={onPick}>
        {uri
          ? <Image source={{ uri }} style={ps.coverImage} resizeMode="cover" />
          : <>
            <Ionicons name="image-outline" size={30} color={colors.primary} />
            <Text style={ps.coverHint}>Upload cover image</Text>
          </>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onPick}>
        <Text style={ps.changeCoverText}>{uri ? 'Change' : 'Choose'} Cover</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Chapter List ──────────────────────────────────────────────────────────────

export function ChapterList({
  chapters,
  onEdit,
  onRemove,
  onAdd,
}: {
  chapters: Chapter[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <View>
      {chapters.map((ch, i) => (
        <View key={ch.id} style={ps.chapterRow}>
          <View style={ps.chapterNumBadge}>
            <Text style={ps.chapterNum}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.chapterTitle} numberOfLines={1}>{ch.title || `Chapter ${i + 1}`}</Text>
            <Text style={ps.chapterMeta}>{ch.content.trim().split(/\s+/).filter(Boolean).length} words</Text>
          </View>
          <TouchableOpacity onPress={() => onEdit(ch.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: spacing.sm }}>
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(ch.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={ps.addChapterBtn} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={ps.addChapterBtnText}>Add Chapter</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

export const ps = StyleSheet.create({
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepDotDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepNum: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: colors.primary },

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
  hint: { fontSize: 11, color: colors.textMuted, fontWeight: '400' },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  dropdown: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 13, color: colors.textPrimary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.md },
  listRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listRowActive: { backgroundColor: '#FFF0E8' },
  listRowText: { fontSize: 13, color: colors.textPrimary },
  listRowTextActive: { color: colors.primary, fontWeight: '700' },

  // Buyer preview
  previewOption: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  previewOptLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  previewOptDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  previewExtra: { backgroundColor: '#FFF8F5', borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.sm },
  pageCountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pageCountLabel: { fontSize: 13, color: colors.textSecondary },
  previewNote: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 16 },

  // Chapter editor
  chapterTabRow: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: spacing.lg, borderRadius: radii.lg, padding: 3, marginBottom: spacing.md },
  chapterTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.md },
  chapterTabActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1 },
  chapterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chapterTabTextActive: { color: colors.primary, fontWeight: '700' },
  chapterContent: { padding: spacing.lg, paddingBottom: 40 },
  toolbar: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.xs, marginBottom: spacing.xs },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  toolBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  toolBtnText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  editorBox: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, minHeight: 200 },
  editor: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, minHeight: 160, textAlignVertical: 'top' },
  wordCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  editorImage: { marginTop: spacing.sm, borderRadius: radii.md, overflow: 'hidden', position: 'relative' },
  editorImageThumb: { width: '100%', height: 160, borderRadius: radii.md },
  editorImageRemove: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
  previewBox: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, minHeight: 300 },
  previewTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  previewContent: { fontSize: 13, color: colors.textPrimary, lineHeight: 22 },
  previewImageFull: { width: '100%', height: 180, borderRadius: radii.lg, marginTop: spacing.md },
  aiAssistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#FFF8F5', borderRadius: radii.xl, paddingVertical: spacing.md, marginTop: spacing.lg },
  aiAssistBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // Chapter list
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  chapterNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  chapterNum: { fontSize: 11, fontWeight: '800', color: colors.primary },
  chapterTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  chapterMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  addChapterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.lg, backgroundColor: '#FFF8F5', marginTop: spacing.sm },
  addChapterBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // Cover picker
  coverBox: { height: 140, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, overflow: 'hidden', backgroundColor: colors.card },
  coverImage: { width: '100%', height: '100%' },
  coverHint: { fontSize: 11, color: colors.textMuted },
  changeCoverText: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: spacing.xs },

  // AI Modal
  aiModal: { flex: 1, backgroundColor: colors.background },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  aiHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiHeaderTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  aiHeaderSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  aiContent: { padding: spacing.lg, paddingBottom: 40 },
  aiWelcome: { alignItems: 'center', paddingVertical: spacing.lg },
  aiWelcomeIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  aiWelcomeTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', lineHeight: 22 },
  aiWelcomeSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs },
  aiSectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  aiActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  aiActionCard: { width: '47%', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  aiActionIcon: { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  aiActionLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, lineHeight: 17 },
  aiOrText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
  aiEmptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  aiEmptyDots: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  aiDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C4B5FD' },
  aiEmptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', lineHeight: 26 },
  aiEmptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.sm },
  // Chat messages
  aiMsgUser: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm },
  aiMsgAi: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  aiMsgAiIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEE9FE', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  aiMsgBubble: { maxWidth: '78%', borderRadius: radii.lg, padding: spacing.md },
  aiMsgBubbleUser: { backgroundColor: colors.primary },
  aiMsgBubbleAi: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  aiMsgText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  aiInsertBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  aiInsertBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  // Input bar
  aiInputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  aiInputIcon: { padding: spacing.xs },
  aiInput: { flex: 1, backgroundColor: colors.background, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary, maxHeight: 100 },
  aiSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  aiSendBtnDisabled: { opacity: 0.4 },
});
