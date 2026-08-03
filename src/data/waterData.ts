import type { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type DrinkTypeId = 'water' | 'tea' | 'coffee' | 'milk' | 'electrolytes' | 'juice' | 'soft-drink' | 'wine' | 'beer' | 'other';

export interface DrinkType {
  id: DrinkTypeId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  /** Approximate share of the raw ml that counts toward net hydration (not scientifically sourced). */
  hydrationFactor: number;
}

export const DRINK_TYPES: DrinkType[] = [
  { id: 'water', label: 'Water', icon: 'water', color: colors.primary, background: '#FFEDE3', hydrationFactor: 1 },
  { id: 'tea', label: 'Tea', icon: 'cafe-outline', color: '#8B6F47', background: '#EFE7DA', hydrationFactor: 1 },
  { id: 'coffee', label: 'Coffee', icon: 'cafe', color: '#6B4A32', background: '#E9DED2', hydrationFactor: 0.9 },
  { id: 'milk', label: 'Milk', icon: 'flask-outline', color: '#A69A87', background: '#F1EEE7', hydrationFactor: 1 },
  { id: 'electrolytes', label: 'Electrolytes', icon: 'flash', color: '#E8A33D', background: '#FDECC8', hydrationFactor: 1 },
  { id: 'juice', label: 'Juice', icon: 'nutrition-outline', color: '#F0883E', background: '#FDE3CC', hydrationFactor: 0.9 },
  { id: 'soft-drink', label: 'Soft drink', icon: 'flask', color: '#E0554F', background: '#FBE0E0', hydrationFactor: 0.85 },
  { id: 'wine', label: 'Wine', icon: 'wine', color: '#7A3B4A', background: '#EFE1E4', hydrationFactor: 0.6 },
  { id: 'beer', label: 'Beer', icon: 'beer', color: '#B9773A', background: '#F1E5D3', hydrationFactor: 0.75 },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#9B9B9B', background: '#EDEDED', hydrationFactor: 1 },
];

export const DRINK_PRESETS_ML = [100, 150, 250, 350, 500];

export function getDrinkType(id: string): DrinkType {
  return DRINK_TYPES.find((d) => d.id === id) ?? DRINK_TYPES[0];
}
