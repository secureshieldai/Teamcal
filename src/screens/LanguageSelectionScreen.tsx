/**
 * Language Selection Screen
 * Displayed on first launch after Splash Screen
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../i18n';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function LanguageSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectLanguage = async (languageCode: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setSelectedLanguage(languageCode);
      
      // Change language and save to storage
      await changeLanguage(languageCode);
      
      // Navigate to onboarding
      navigation.replace('Onboarding');
    } catch (error) {
      console.error('[LanguageSelection] Error changing language:', error);
      setIsLoading(false);
      setSelectedLanguage(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="language" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.subtitle}>Select your preferred language to continue</Text>
        </View>

        {/* Language List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_LANGUAGES.map((language) => {
            const isSelected = selectedLanguage === language.code;
            const isDisabled = isLoading && !isSelected;
            
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageButton,
                  isSelected && styles.languageButtonSelected,
                  isDisabled && styles.languageButtonDisabled
                ]}
                onPress={() => handleSelectLanguage(language.code)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.languageContent}>
                  <Text style={[
                    styles.languageName,
                    isSelected && styles.languageNameSelected
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageEnglishName,
                    isSelected && styles.languageEnglishNameSelected
                  ]}>
                    {language.name}
                  </Text>
                </View>
                
                {isSelected ? (
                  isLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                  )
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer hint */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            You can change this later in Settings
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  languageButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageButtonDisabled: {
    opacity: 0.5,
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: colors.white,
  },
  languageEnglishName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  languageEnglishNameSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
