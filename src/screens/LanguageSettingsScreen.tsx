/**
 * Language Settings Screen
 * Allows users to change their language preference from Settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { changeLanguage, getSavedLanguage, SUPPORTED_LANGUAGES } from '../i18n';
import { colors, spacing, typography } from '../theme';

export default function LanguageSettingsScreen() {
  const navigation = useNavigation();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Load current language
    getSavedLanguage().then((lang) => {
      if (lang) setCurrentLanguage(lang);
    });
  }, []);

  const handleChangeLanguage = async (languageCode: string) => {
    if (isChanging || languageCode === currentLanguage) return;

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);
      setCurrentLanguage(languageCode);

      Alert.alert(
        'Language Changed',
        `The app language has been changed. ${
          languageCode === 'ar' ? 'For full RTL support, please restart the app.' : ''
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not change language. Please try again.');
      console.error('[LanguageSettings] Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Select your preferred language</Text>

        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected = currentLanguage === language.code;
          const isDisabled = isChanging && !isSelected;

          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageRow,
                isSelected && styles.languageRowSelected,
                isDisabled && { opacity: 0.5 },
              ]}
              onPress={() => handleChangeLanguage(language.code)}
              disabled={isChanging}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.languageNameMain,
                    isSelected && styles.languageNameSelected,
                  ]}
                >
                  {language.nativeName}
                </Text>
                <Text style={styles.languageNameSub}>{language.name}</Text>
              </View>

              {isSelected && (
                isChanging ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageRowSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  languageNameMain: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  languageNameSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
