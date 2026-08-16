import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MealPlanWizard from './mealplan/MealPlanWizard';
import MealPlanDashboard from './mealplan/MealPlanDashboard';
import MealPlannerEmptyState from './mealplan/EmptyState';
import { useMealPlan } from '../hooks/useMealPlan';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function MealPlannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    plan,
    loading,
    generate,
    updatePreferences,
    regenerateDay,
    regenerateMeal,
    updateMeal,
    toggleMealComplete,
    removeMeal,
    deletePlan,
    groceryList,
  } = useMealPlan();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (wizardOpen) {
    return (
      <MealPlanWizard
        existingPlan={plan}
        onClose={() => setWizardOpen(false)}
        onSubmit={async (prefs) => {
          if (plan) await updatePreferences(prefs);
          else await generate(prefs);
          setWizardOpen(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Meal Planner</Text>
          <Text style={styles.subtitle}>AI plans + grocery lists</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : plan ? (
        <MealPlanDashboard
          plan={plan}
          regenerateDay={regenerateDay}
          regenerateMeal={regenerateMeal}
          updateMeal={updateMeal}
          toggleMealComplete={toggleMealComplete}
          removeMeal={removeMeal}
          updatePreferences={updatePreferences}
          deletePlan={deletePlan}
          groceryList={groceryList}
          onEditPreferences={() => setWizardOpen(true)}
        />
      ) : (
        <MealPlannerEmptyState onCreate={() => setWizardOpen(true)} />
      )}
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
