import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../components/SearchBar';
import SectionHeader from '../components/SectionHeader';
import ToolsGrid from '../components/ToolsGrid';
import { colors, spacing, typography } from '../theme';
import { tools } from '../data/exploreData';
import type { RootStackParamList } from '../navigation/types';

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePressTool = (id: string) => {
    switch (id) {
      case 'ai-food-scanner': navigation.navigate('ScanFood', { mode: 'food' }); return;
      case 'barcode-scanner': navigation.navigate('ScanFood', { mode: 'barcode' }); return;
      case 'scan-cook': navigation.navigate('ScanFood', { mode: 'cook' }); return;
      case 'meal-planner': navigation.navigate('MealPlanner'); return;
      case 'ai-coach': navigation.navigate('CoachChat'); return;
      case 'grocery-list': navigation.navigate('GroceryList'); return;
      case 'workout': navigation.navigate('Workouts'); return;
      case 'step-tracker': navigation.navigate('Steps'); return;
      case 'water-tracker': navigation.navigate('Water'); return;
      case 'fasting-tracker': navigation.navigate('Fasting'); return;
      case 'weight-tracker': navigation.navigate('QuickLogEntry', { kind: 'weight' }); return;
      case 'sleep-tracker': navigation.navigate('QuickLogEntry', { kind: 'sleep' }); return;
      case 'supplement-tracker': navigation.navigate('QuickLogEntry', { kind: 'supplement' }); return;
      case 'mood-journal': navigation.navigate('QuickLogEntry', { kind: 'mood' }); return;
      case 'my-goals': navigation.navigate('Goals'); return;
      case 'recipe-library': navigation.navigate('PersonalTool',{kind:'recipe-library'}); return;
      case 'my-recipes': navigation.navigate('PersonalTool',{kind:'my-recipes'}); return;
      case 'period-tracker': navigation.navigate('PersonalTool',{kind:'period-tracker'}); return;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Explore</Text>

        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Search tools, meals, recipes, features..."
            value={query}
            onChangeText={setQuery}
            onSubmit={() => navigation.navigate('GlobalSearch', { query })}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Tools" />
          <ToolsGrid items={tools} onPressItem={handlePressTool} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
});
