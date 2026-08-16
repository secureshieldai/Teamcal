import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../theme';
import { Chip, ChipWrap, WizardFooter, WizardStepHeader } from '../../mealplan/steps/shared';

const BODY_AREAS = ['Full body', 'Upper body', 'Arms', 'Chest', 'Waist', 'Legs', 'Glutes', 'Back', 'Shoulders'];

type Props = {
  bodyArea: string;
  onChangeBodyArea: (v: string) => void;
  photoUri: string | null;
  onChangePhoto: (v: string | null) => void;
  onNext: () => void;
};

export default function BodyScanStep({ bodyArea, onChangeBodyArea, photoUri, onChangePhoto, onNext }: Props) {
  const pickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!picked.canceled) onChangePhoto(picked.assets[0].uri);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="1. Body scan" />
      <ChipWrap>
        {BODY_AREAS.map((area) => (
          <Chip key={area} label={area} selected={bodyArea === area} solid onPress={() => onChangeBodyArea(area)} />
        ))}
      </ChipWrap>

      <TouchableOpacity style={styles.dropzone} onPress={pickPhoto} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      <WizardFooter onNext={onNext} nextLabel="Next: describe goals" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dropzone: {
    marginTop: spacing.xl,
    height: 160,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
});
