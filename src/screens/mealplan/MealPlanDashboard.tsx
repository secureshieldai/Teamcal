import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { DIET_PREFERENCES, MEAL_TYPE_META } from '../../data/mealPlanWizardData';
import type { MealPlan, PlanMeal } from '../../services/api/mealplan.service';
import type { useMealPlan } from '../../hooks/useMealPlan';
import { shoppingService } from '../../services/api/shopping.service';
import GroceryListModal from '../../components/mealplan/GroceryListModal';

type MealPlanHook = ReturnType<typeof useMealPlan>;

type Props = {
  plan: MealPlan;
  regenerateDay: MealPlanHook['regenerateDay'];
  regenerateMeal: MealPlanHook['regenerateMeal'];
  updateMeal: MealPlanHook['updateMeal'];
  toggleMealComplete: MealPlanHook['toggleMealComplete'];
  removeMeal: MealPlanHook['removeMeal'];
  updatePreferences: MealPlanHook['updatePreferences'];
  deletePlan: MealPlanHook['deletePlan'];
  groceryList: MealPlanHook['groceryList'];
  onEditPreferences: () => void;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const mealIcon = (mealType: string) => MEAL_TYPE_META.find((m) => m.id === mealType)?.icon ?? 'restaurant-outline';

export default function MealPlanDashboard({
  plan,
  regenerateDay,
  regenerateMeal,
  updateMeal,
  toggleMealComplete,
  removeMeal,
  updatePreferences,
  deletePlan,
  groceryList,
  onEditPreferences,
}: Props) {
  const days = plan.days;
  const initialDayIndex = useMemo(() => {
    const idx = days.findIndex((d) => d.date === todayKey());
    return idx >= 0 ? idx : 0;
  }, [days]);

  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const day = days[Math.min(dayIndex, days.length - 1)];
  const isToday = day?.date === todayKey();

  const [pendingDiet, setPendingDiet] = useState<string | null>(null);
  const [pendingCalories, setPendingCalories] = useState<number | null>(null);
  const dirty = (pendingDiet !== null && pendingDiet !== plan.diet_preference) || (pendingCalories !== null && pendingCalories !== plan.daily_calories);

  const [saving, setSaving] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState(false);
  const [busyMealId, setBusyMealId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [actionMeal, setActionMeal] = useState<PlanMeal | null>(null);
  const [recipeMeal, setRecipeMeal] = useState<PlanMeal | null>(null);
  const [editingMeal, setEditingMeal] = useState<PlanMeal | null>(null);
  const [editForm, setEditForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fats: '' });

  const [groceryOpen, setGroceryOpen] = useState(false);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [groceryItems, setGroceryItems] = useState<string[]>([]);

  const totals = day.meals.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fats: acc.fats + m.fats }),
    { kcal: 0, protein: 0, carbs: 0, fats: 0 }
  );
  const percent = plan.daily_calories > 0 ? Math.min(100, Math.round((totals.kcal / plan.daily_calories) * 100)) : 0;

  const dayLabel = isToday ? 'Today' : new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' });
  const dateLabel = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const saveChanges = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        durationDays: plan.duration_days,
        dailyCalories: pendingCalories ?? plan.daily_calories,
        mealTypes: plan.meal_types,
        dietaryRestrictions: plan.dietary_restrictions,
        dietPreference: pendingDiet ?? plan.diet_preference,
        allergies: plan.allergies,
        healthConditions: plan.health_conditions,
        notes: plan.notes,
      });
      setPendingDiet(null);
      setPendingCalories(null);
    } catch (e) {
      Alert.alert('Unable to save changes', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doRegenerateDay = async () => {
    setRegeneratingDay(true);
    try {
      await regenerateDay(dayIndex);
    } catch (e) {
      Alert.alert('Unable to regenerate', (e as Error).message);
    } finally {
      setRegeneratingDay(false);
    }
  };

  const doRegenerateMeal = async (meal: PlanMeal) => {
    setActionMeal(null);
    setBusyMealId(meal.id);
    try {
      await regenerateMeal(dayIndex, meal.id);
    } catch (e) {
      Alert.alert('Unable to regenerate meal', (e as Error).message);
    } finally {
      setBusyMealId(null);
    }
  };

  const doRemoveMeal = (meal: PlanMeal) => {
    setActionMeal(null);
    Alert.alert('Remove meal?', `Remove "${meal.name}" from this day.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyMealId(meal.id);
          try {
            await removeMeal(dayIndex, meal.id);
          } catch (e) {
            Alert.alert('Unable to remove meal', (e as Error).message);
          } finally {
            setBusyMealId(null);
          }
        },
      },
    ]);
  };

  const openEditMeal = (meal: PlanMeal) => {
    setActionMeal(null);
    setEditingMeal(meal);
    setEditForm({ name: meal.name, kcal: String(meal.kcal), protein: String(meal.protein), carbs: String(meal.carbs), fats: String(meal.fats) });
  };

  const saveEditMeal = async () => {
    if (!editingMeal) return;
    try {
      await updateMeal(dayIndex, editingMeal.id, {
        name: editForm.name.trim() || editingMeal.name,
        kcal: Number(editForm.kcal) || editingMeal.kcal,
        protein: Number(editForm.protein) || 0,
        carbs: Number(editForm.carbs) || 0,
        fats: Number(editForm.fats) || 0,
      });
      setEditingMeal(null);
    } catch (e) {
      Alert.alert('Unable to save meal', (e as Error).message);
    }
  };

  const openGroceryList = async () => {
    setGroceryOpen(true);
    setGroceryLoading(true);
    try {
      setGroceryItems(await groceryList(dayIndex));
    } catch (e) {
      Alert.alert('Unable to load grocery list', (e as Error).message);
      setGroceryItems([]);
    } finally {
      setGroceryLoading(false);
    }
  };

  const addToShoppingList = async (items: string[]) => {
    for (const item of items) {
      await shoppingService.add(item);
    }
  };

  const confirmDeletePlan = () => {
    setHeaderMenuOpen(false);
    Alert.alert('Delete meal plan?', 'This will remove your entire plan. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan() },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.menuBtn} onPress={() => setHeaderMenuOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadow.card]}>
          <View style={styles.dayPagerRow}>
            <TouchableOpacity onPress={() => setDayIndex((i) => Math.max(0, i - 1))} disabled={dayIndex === 0} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={18} color={dayIndex === 0 ? colors.border : colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.dayPagerLabel}>{dayLabel}</Text>
              <Text style={styles.dayPagerDate}>{dateLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setDayIndex((i) => Math.min(days.length - 1, i + 1))}
              disabled={dayIndex >= days.length - 1}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color={dayIndex >= days.length - 1 ? colors.border : colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroCaption}>KCAL</Text>
              <Text style={[styles.macroValue, { color: colors.primary }]}>{totals.kcal}</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroCaption}>P</Text>
              <Text style={styles.macroValue}>{totals.protein}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroCaption}>C</Text>
              <Text style={styles.macroValue}>{totals.carbs}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroCaption}>F</Text>
              <Text style={styles.macroValue}>{totals.fats}g</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietRow}>
          {DIET_PREFERENCES.map((option) => {
            const active = (pendingDiet ?? plan.diet_preference) === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.dietPill, active && styles.dietPillActive]}
                onPress={() => setPendingDiet(option)}
              >
                <Text style={[styles.dietPillText, active && styles.dietPillTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.card, shadow.card]}>
          <View style={styles.calorieHeader}>
            <Text style={styles.sectionLabel}>Calorie target</Text>
            <Text style={styles.calorieValue}>{(pendingCalories ?? plan.daily_calories).toLocaleString()} kcal</Text>
          </View>
          <CalorieMiniSlider value={pendingCalories ?? plan.daily_calories} onChange={setPendingCalories} />
        </View>

        {dirty && (
          <View style={styles.dirtyBanner}>
            <Text style={styles.dirtyText}>Changes not saved.</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={saveChanges} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {day.meals.map((meal) => (
            <View key={meal.id} style={[styles.mealCard, shadow.soft]}>
              <View style={styles.mealIcon}>
                <Ionicons name={mealIcon(meal.mealType)} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealType}>{meal.mealType.toUpperCase()}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMeta}>
                  {meal.kcal} kcal · P{meal.protein} C{meal.carbs} F{meal.fats}
                </Text>
              </View>
              {busyMealId === meal.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <TouchableOpacity style={[styles.checkBtn, meal.completed && styles.checkBtnActive]} onPress={() => toggleMealComplete(dayIndex, meal.id)}>
                    <Ionicons name="checkmark" size={15} color={meal.completed ? colors.white : colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.moreBtn} onPress={() => setActionMeal(meal)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.regenerateBtn} onPress={doRegenerateDay} disabled={regeneratingDay}>
            <Ionicons name="refresh" size={16} color={colors.textPrimary} />
            <Text style={styles.regenerateText}>{regeneratingDay ? 'Regenerating…' : 'Regenerate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.groceryBtn} onPress={openGroceryList}>
            <Ionicons name="cart" size={16} color={colors.white} />
            <Text style={styles.groceryText}>Grocery list</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Header ⋮ menu */}
      <Modal visible={headerMenuOpen} transparent animationType="fade" onRequestClose={() => setHeaderMenuOpen(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setHeaderMenuOpen(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setHeaderMenuOpen(false);
                onEditPreferences();
              }}
            >
              <Text style={styles.menuRowText}>Edit preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={confirmDeletePlan}>
              <Text style={[styles.menuRowText, { color: '#FF4D5E' }]}>Delete plan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Per-meal action menu */}
      <Modal visible={!!actionMeal} transparent animationType="fade" onRequestClose={() => setActionMeal(null)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setActionMeal(null)}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                const meal = actionMeal;
                setActionMeal(null);
                setRecipeMeal(meal);
              }}
            >
              <Text style={styles.menuRowText}>View Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => actionMeal && openEditMeal(actionMeal)}>
              <Text style={styles.menuRowText}>Edit Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => actionMeal && doRegenerateMeal(actionMeal)}>
              <Text style={styles.menuRowText}>Swap Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => actionMeal && doRegenerateMeal(actionMeal)}>
              <Text style={styles.menuRowText}>Regenerate Only This Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => actionMeal && doRemoveMeal(actionMeal)}>
              <Text style={[styles.menuRowText, { color: '#FF4D5E' }]}>Remove Meal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Recipe modal */}
      <Modal visible={!!recipeMeal} transparent animationType="fade" onRequestClose={() => setRecipeMeal(null)}>
        <View style={styles.menuBackdrop}>
          <View style={styles.recipeCard}>
            <View style={styles.header}>
              <Text style={styles.recipeTitle}>{recipeMeal?.name}</Text>
              <TouchableOpacity onPress={() => setRecipeMeal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.recipeBody}>{recipeMeal?.recipe}</Text>
          </View>
        </View>
      </Modal>

      {/* Edit meal modal */}
      <Modal visible={!!editingMeal} transparent animationType="fade" onRequestClose={() => setEditingMeal(null)}>
        <View style={styles.menuBackdrop}>
          <View style={styles.recipeCard}>
            <View style={styles.header}>
              <Text style={styles.recipeTitle}>Edit Meal</Text>
              <TouchableOpacity onPress={() => setEditingMeal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.editInput} value={editForm.name} onChangeText={(v) => setEditForm({ ...editForm, name: v })} placeholder="Name" />
            <View style={styles.editRow}>
              {(['kcal', 'protein', 'carbs', 'fats'] as const).map((key) => (
                <TextInput
                  key={key}
                  style={[styles.editInput, { flex: 1 }]}
                  value={editForm[key]}
                  onChangeText={(v) => setEditForm({ ...editForm, [key]: v })}
                  placeholder={key}
                  keyboardType="number-pad"
                />
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEditMeal}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <GroceryListModal
        visible={groceryOpen}
        loading={groceryLoading}
        items={groceryItems}
        onClose={() => setGroceryOpen(false)}
        onAddToShoppingList={addToShoppingList}
      />
    </View>
  );
}

function CalorieMiniSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const MIN = 800;
  const MAX = 4000;
  const percent = ((Math.min(MAX, Math.max(MIN, value)) - MIN) / (MAX - MIN)) * 100;
  const step = 50;
  const [trackWidth, setTrackWidth] = useState(0);

  return (
    <View
      style={styles.sliderTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        if (trackWidth <= 0) return;
        const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / trackWidth));
        onChange(Math.round((MIN + ratio * (MAX - MIN)) / step) * step);
      }}
      onResponderMove={(e) => {
        if (trackWidth <= 0) return;
        const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / trackWidth));
        onChange(Math.round((MIN + ratio * (MAX - MIN)) / step) * step);
      }}
    >
      <View style={[styles.sliderFill, { width: `${percent}%` }]} />
      <View style={[styles.sliderThumb, { left: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    position: 'absolute',
    top: -4,
    right: spacing.lg,
    zIndex: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  dayPagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayPagerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayPagerDate: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  macroCol: {
    alignItems: 'center',
    flex: 1,
  },
  macroCaption: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  dietRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  dietPill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
  },
  dietPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dietPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dietPillTextActive: {
    color: colors.white,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    marginLeft: -9,
  },
  dirtyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3EC',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  dirtyText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12.5,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealType: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  mealName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  mealMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  moreBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  regenerateText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groceryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  groceryText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,43,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  menuCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
  },
  menuRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recipeCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recipeBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
