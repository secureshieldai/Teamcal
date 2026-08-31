import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../../theme';

interface Template {
  key: string;
  label: string;
  description?: string;
  posts: number;
  icon: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (key: string) => void;
  templates: Template[];
}

export default function TemplateLibraryModal({ visible, onClose, onSelectTemplate, templates }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Template Library</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.subtitle}>
            Choose a template to get started. Templates pre-configure settings, post types, and recommended content based on your goal.
          </Text>

          {templates.map((template) => (
            <TouchableOpacity
              key={template.key}
              style={[s.templateItem, shadow.soft]}
              onPress={() => setExpandedKey(expandedKey === template.key ? null : template.key)}
              activeOpacity={0.75}
            >
              <View style={s.templateHeader}>
                <View style={s.iconCircle}>
                  <Ionicons name={template.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.templateTitle}>{template.label}</Text>
                  <Text style={s.templateMeta}>{template.posts} posts included</Text>
                </View>
                <Ionicons
                  name={expandedKey === template.key ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </View>

              {expandedKey === template.key && (
                <>
                  <Text style={s.description}>{template.description}</Text>
                  <TouchableOpacity
                    style={s.useButton}
                    onPress={() => onSelectTemplate(template.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.useButtonText}>Use Template</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
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
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: spacing.lg,
  },
  templateItem: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(62,123,250,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  templateMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  useButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
