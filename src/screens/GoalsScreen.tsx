import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GoalSlider from '../components/GoalSlider';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { userService } from '../services/api/user.service';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { personalService } from '../services/api/personal.service';

const FOCUS_AREAS = [
  { id: 'fat-loss', label: 'Fat loss' },
  { id: 'weight-gain', label: 'Weight gain' },
  { id: 'muscle', label: 'Muscle' },
  { id: 'longevity', label: 'Longevity' },
  { id: 'energy', label: 'Energy' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'stress', label: 'Stress' },
  { id: 'heart-health', label: 'Heart health' },
  { id: 'mental-clarity', label: 'Mental clarity' },
  { id: 'gut-health', label: 'Gut health' },
  { id: 'hormones', label: 'Hormones' },
  { id: 'recovery', label: 'Recovery' },
];

const formatIncomeAmount = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
};

export default function GoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();

  const [focusAreas, setFocusAreas] = useState<string[]>(user?.goal_focus_areas?.length ? user.goal_focus_areas : ['fat-loss']);
  const [fastHours, setFastHours] = useState(user?.goal_fast_hours ?? 16);
  const [waterMl, setWaterMl] = useState(user?.goal_water_ml ?? 2500);
  const [steps, setSteps] = useState(user?.goal_steps ?? 8000);
  const [sleepHours, setSleepHours] = useState(user?.goal_sleep_hours ?? 8);
  const [kcal, setKcal] = useState(user?.goal_kcal ?? 2000);
  const [proteinG, setProteinG] = useState(user?.goal_protein_g ?? 140);
  const [carbsG, setCarbsG] = useState(user?.goal_carbs_g ?? 200);
  const [fatsG, setFatsG] = useState(user?.goal_fats_g ?? 65);
  const [weightKg, setWeightKg] = useState(user?.goal_weight_kg ?? 75);
  const [incomeGoal, setIncomeGoal] = useState(1000);
  const [incomeGoalInput, setIncomeGoalInput] = useState('1,000');
  const [saving, setSaving] = useState(false);
  const [incomeRecordId,setIncomeRecordId]=useState<string>();

  useEffect(() => {
    personalService.list<{value:number}>('income-goal').then(rows=>{if(rows[0]){const value=Number(rows[0].data.value);setIncomeRecordId(rows[0].id);setIncomeGoal(value);setIncomeGoalInput(formatIncomeAmount(String(value)));}}).catch(()=>{});
  }, []);

  const handleIncomeGoalChange = (value: string) => {
    const formatted = formatIncomeAmount(value);
    setIncomeGoalInput(formatted);
    setIncomeGoal(Number(formatted.replace(/,/g, '')) || 0);
  };

  const toggleFocusArea = (id: string) => {
    setFocusAreas((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateGoals({ kcal, proteinG, carbsG, fatsG, steps, waterMl, sleepHours, weightKg, fastHours, focusAreas });
      const value={value:incomeGoal};
      if(incomeRecordId) await personalService.update(incomeRecordId,value); else {const record=await personalService.create('income-goal',value,{externalKey:'monthly'});setIncomeRecordId(record.id);}
      await refreshUser();
      Alert.alert('Goals updated', 'Your targets have been saved and will show up across your trackers.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Could not save goals', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Your Goals</Text>
            <Text style={styles.subtitle}>Nutrition & fasting targets</Text>
          </View>
        </View>

        <LinearGradient colors={['#FFEDE3', '#FDE3CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="sparkles" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightLabel}>BLAZE — SMART INSIGHT</Text>
            <Text style={styles.insightText}>Log for a few days and Blaze will show you where you're winning.</Text>
          </View>
        </LinearGradient>

        <View style={[styles.card, shadow.card]}>
          <View style={styles.focusHeaderRow}>
            <View style={styles.focusIcon}>
              <Ionicons name="locate-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>Major focus areas</Text>
              <Text style={styles.focusSubtitle}>Blaze weighs your plan around these</Text>
            </View>
          </View>
          <View style={styles.chipWrap}>
            {FOCUS_AREAS.map((area) => {
              const active = focusAreas.includes(area.id);
              return (
                <TouchableOpacity key={area.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleFocusArea(area.id)}>
                  {active && <Ionicons name="checkmark" size={13} color={colors.white} style={{ marginRight: 4 }} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{area.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, shadow.card]}>
          <GoalSlider label="Fasting window" value={fastHours} unit="h" min={12} max={24} step={1} onChange={setFastHours} />
          <GoalSlider label="Water" value={waterMl} unit="ml" min={1000} max={5000} step={100} onChange={setWaterMl} />
          <GoalSlider label="Steps" value={steps} min={2000} max={20000} step={500} onChange={setSteps} />
          <GoalSlider label="Sleep" value={sleepHours} unit="h" min={4} max={12} step={0.5} onChange={setSleepHours} />
          <GoalSlider label="Daily calories" value={kcal} unit="kcal" min={1200} max={4000} step={50} onChange={setKcal} />
          <GoalSlider label="Protein" value={proteinG} unit="g" min={40} max={300} step={5} onChange={setProteinG} />
          <GoalSlider label="Carbs" value={carbsG} unit="g" min={50} max={500} step={5} onChange={setCarbsG} />
          <GoalSlider label="Fats" value={fatsG} unit="g" min={20} max={150} step={5} onChange={setFatsG} />
          <GoalSlider label="Target weight" value={weightKg} unit="kg" min={40} max={150} step={1} onChange={setWeightKg} />
          <View style={styles.incomeGoalWrap}>
            <Text style={styles.incomeGoalLabel}>Monthly income goal</Text>
            <View style={styles.incomeInputWrap}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={incomeGoalInput}
                onChangeText={handleIncomeGoalChange}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={styles.incomeInput}
                accessibilityLabel="Monthly income goal in US dollars"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save goals'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  insightText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  incomeGoalWrap: {
    marginBottom: spacing.xs,
  },
  incomeGoalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  incomeInputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  incomeInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  focusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  focusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  focusSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
});
