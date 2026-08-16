import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WorkoutsHome from './workouts/WorkoutsHome';
import CreateWorkoutScreen from './workouts/CreateWorkoutScreen';
import ScanCoachScreen from './workouts/scanCoach/ScanCoachScreen';
import RecommendationsScreen from './workouts/RecommendationsScreen';
import WorkoutProgressScreen from './workouts/ProgressScreen';
import WorkoutHistoryScreen from './workouts/WorkoutHistoryScreen';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { Workout } from '../types/api';

type WorkoutsView = 'home' | 'create' | 'scan' | 'recommendations' | 'progress' | 'history';

export default function WorkoutsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [view, setView] = useState<WorkoutsView>('home');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const goHome = () => setView('home');

  const startWorkout = (workout: Workout) => {
    navigation.navigate('WorkoutSession', {
      workout: { id: workout.id, title: workout.title, duration: workout.duration, exercises: workout.exercises },
    });
  };

  if (view === 'create') {
    return <CreateWorkoutScreen existing={editingWorkout} onClose={goHome} onSaved={goHome} />;
  }
  if (view === 'scan') {
    return <ScanCoachScreen onClose={goHome} onSaved={goHome} />;
  }
  if (view === 'recommendations') {
    return <RecommendationsScreen onClose={goHome} />;
  }
  if (view === 'progress') {
    return <WorkoutProgressScreen onClose={goHome} />;
  }
  if (view === 'history') {
    return <WorkoutHistoryScreen onClose={goHome} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>AI-generated plans</Text>
        </View>
      </View>

      <WorkoutsHome
        onOpenScanCoach={() => setView('scan')}
        onOpenRecommendations={() => setView('recommendations')}
        onOpenProgress={() => setView('progress')}
        onOpenHistory={() => setView('history')}
        onCreateWorkout={() => {
          setEditingWorkout(null);
          setView('create');
        }}
        onEditWorkout={(w) => {
          setEditingWorkout(w);
          setView('create');
        }}
        onStartWorkout={startWorkout}
      />
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
});
