import type { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type DrinkTypeId = 'water' | 'tea' | 'coffee' | 'milk' | 'electrolytes' | 'juice' | 'soft-drink' | 'wine' | 'beer';

export interface DrinkType {
  id: DrinkTypeId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  /** Approximate share of the raw ml that counts toward net hydration (not scientifically sourced). */
  hydrationFactor: number;
  /** One-line description shown under the drink name in the log modal. */
  description: string;
  /** Typical serving size (ml) used to preview "Hydration math" before a custom amount is entered. */
  referenceMl: number;
}

export const DRINK_TYPES: DrinkType[] = [
  { id: 'water', label: 'Water', icon: 'water', color: colors.primary, background: '#FFEDE3', hydrationFactor: 1, description: 'Pure hydration', referenceMl: 250 },
  { id: 'tea', label: 'Tea', icon: 'cafe-outline', color: '#8B6F47', background: '#EFE7DA', hydrationFactor: 0.9, description: 'Mostly water, light caffeine', referenceMl: 250 },
  { id: 'coffee', label: 'Coffee', icon: 'cafe', color: '#6B4A32', background: '#E9DED2', hydrationFactor: 0.7, description: 'Caffeine reduces hydration', referenceMl: 240 },
  { id: 'milk', label: 'Milk', icon: 'flask-outline', color: '#A69A87', background: '#F1EEE7', hydrationFactor: 1, description: 'Hydrating, plus protein & calcium', referenceMl: 250 },
  { id: 'electrolytes', label: 'Electrolytes', icon: 'flash', color: '#E8A33D', background: '#FDECC8', hydrationFactor: 1, description: 'Replenishes fluids & minerals', referenceMl: 500 },
  { id: 'juice', label: 'Juice', icon: 'nutrition-outline', color: '#F0883E', background: '#FDE3CC', hydrationFactor: 0.85, description: 'Hydrating, but sugar slows absorption', referenceMl: 250 },
  { id: 'soft-drink', label: 'Soft drink', icon: 'flask', color: '#E0554F', background: '#FBE0E0', hydrationFactor: 0.7, description: 'Poor hydration, high sugar', referenceMl: 330 },
  { id: 'wine', label: 'Wine', icon: 'wine', color: '#7A3B4A', background: '#EFE1E4', hydrationFactor: 0.6, description: 'Alcohol dehydrates the body', referenceMl: 150 },
  { id: 'beer', label: 'Beer', icon: 'beer', color: '#B9773A', background: '#F1E5D3', hydrationFactor: 0.75, description: 'Alcohol lowers net hydration', referenceMl: 330 },
];

export const DRINK_PRESETS_ML = [100, 150, 250, 350, 500];

export function getDrinkType(id: string): DrinkType {
  return DRINK_TYPES.find((d) => d.id === id) ?? DRINK_TYPES[0];
}
