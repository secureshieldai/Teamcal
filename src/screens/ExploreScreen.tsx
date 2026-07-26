import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../components/SearchBar';
import SectionHeader from '../components/SectionHeader';
import QuickAccessGrid from '../components/QuickAccessGrid';
import PopularChallengeCards from '../components/PopularChallengeCards';
import TopCreatorsList from '../components/TopCreatorsList';
import CategoriesGrid from '../components/CategoriesGrid';
import { colors, spacing, typography } from '../theme';
import { quickAccessItems, popularChallenges, topCreators, categories } from '../data/exploreData';
import type { NoParamRoute, RootStackParamList } from '../navigation/types';

const QUICK_ACCESS_DESTINATIONS: Record<string, NoParamRoute> = {
  'meal-planner': 'MealPlanner',
  workouts: 'Workouts',
  'ai-coach': 'CoachChat',
  'grocery-list': 'GroceryList',
  more: 'Plus',
};

const CATEGORY_DESTINATIONS: Record<string, NoParamRoute> = {
  nutrition: 'MealPlanner',
  workouts: 'Workouts',
  challenges: 'Challenges',
  meals: 'MealPlanner',
  programs: 'Marketplace',
  supplements: 'Marketplace',
  recipes: 'MealPlanner',
};

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
            placeholder="Search tools, meals, people, challenges..."
            value={query}
            onChangeText={setQuery}
            onSubmit={() => navigation.navigate('GlobalSearch', { query })}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quick Access" actionLabel="See All" onPressAction={() => navigation.navigate('Plus')} />
          <QuickAccessGrid
            items={quickAccessItems}
            onPressItem={(id) => {
              if (id === 'ai-food-scanner' || id === 'barcode-scanner') { navigation.navigate('ScanFood', { mode: id === 'barcode-scanner' ? 'barcode' : 'food' }); return; }
              const trackerKind: Record<string, string> = { 'steps-tracker': 'steps', 'water-tracker': 'water', 'fasting-tracker': 'fasting' };
              if (trackerKind[id]) { navigation.navigate('QuickLogEntry', { kind: trackerKind[id] }); return; }
              const destination = QUICK_ACCESS_DESTINATIONS[id];
              if (destination) navigation.navigate(destination as never);
            }}
          />
        </View>

        <View style={styles.sectionNoPad}>
          <SectionHeader title="Popular This Week" actionLabel="See All" onPressAction={() => navigation.navigate('Challenges')} style={styles.paddedHeader} />
          <PopularChallengeCards
            challenges={popularChallenges}
            onPressChallenge={() => navigation.navigate('Challenges')}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Top Creators" actionLabel="See All" onPressAction={() => navigation.navigate('GlobalSearch', { query: 'coach' })} />
          <TopCreatorsList creators={topCreators} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Categories" />
          <CategoriesGrid
            categories={categories}
            onPressCategory={(id) => {
              const destination = CATEGORY_DESTINATIONS[id];
              if (destination) navigation.navigate(destination as never);
            }}
          />
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
  sectionNoPad: {
    marginTop: spacing.xl,
  },
  paddedHeader: {
    paddingHorizontal: spacing.lg,
  },
});
