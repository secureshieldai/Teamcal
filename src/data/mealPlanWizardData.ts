import type { MealType } from '../services/api/mealplan.service';

export const MEAL_TYPE_META: { id: MealType; label: string; icon: 'cafe-outline' | 'restaurant-outline' | 'nutrition-outline' | 'flame-outline' }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner', label: 'Dinner', icon: 'nutrition-outline' },
  { id: 'snack', label: 'Snack', icon: 'flame-outline' },
];

export const DIETARY_RESTRICTIONS = ['Vegetarian', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free', 'Other'];

export const DIET_PREFERENCES = [
  'Balanced',
  'High Protein',
  'Weight Loss',
  'Muscle Gain',
  'High Fiber',
  'Low Carb',
  'Mediterranean',
  'Keto',
  'Paleo',
  'Budget Friendly',
  'Family Friendly',
  'Other',
];

export const ALLERGIES = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat', 'None', 'Other'];

export const HEALTH_CONDITIONS = ['Diabetes', 'High Blood Pressure', 'PCOS', 'Thyroid Disorder', 'High Cholesterol', 'IBS', 'None', 'Other'];
