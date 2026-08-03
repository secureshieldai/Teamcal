import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
];

type Props = {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  photo: string;
  setPhoto: (v: string) => void;
  onNext: () => void;
};

export default function CreateBasicsStep({ name, setName, description, setDescription, photo, setPhoto, onNext }: Props) {
  const pickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!picked.canceled) setPhoto(picked.assets[0].uri);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.fieldLabel}>Challenge Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. 10K Steps Challenge" placeholderTextColor={colors.textMuted} />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell people what this challenge is about..."
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Text style={styles.fieldLabel}>Cover Image</Text>
      <View style={styles.coverRow}>
        <TouchableOpacity style={styles.uploadBox} onPress={pickPhoto}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.textMuted} />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
        {PRESET_COVERS.map((uri) => (
          <TouchableOpacity key={uri} onPress={() => setPhoto(uri)} style={[styles.presetBox, photo === uri && styles.presetBoxActive]}>
            <Image source={{ uri }} style={styles.presetImage} />
          </TouchableOpacity>
        ))}
      </View>
      {photo && !PRESET_COVERS.includes(photo) && (
        <View style={styles.selectedPreviewRow}>
          <Image source={{ uri: photo }} style={styles.selectedPreview} />
          <Text style={styles.selectedText}>Custom image selected</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.primaryBtn, !name.trim() && styles.primaryBtnDisabled]} disabled={!name.trim()} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  coverRow: { flexDirection: 'row', gap: spacing.sm },
  uploadBox: { width: 70, height: 70, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadText: { fontSize: 9.5, color: colors.textMuted, fontWeight: '600' },
  presetBox: { width: 70, height: 70, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  presetBoxActive: { borderColor: colors.primary },
  presetImage: { width: '100%', height: '100%' },
  selectedPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  selectedPreview: { width: 40, height: 40, borderRadius: radii.md },
  selectedText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginTop: spacing.xxl },
  primaryBtnDisabled: { backgroundColor: colors.ringTrack },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
