import type { Ionicons } from '@expo/vector-icons';

export interface ArticleCategory {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: 'weight', label: 'Weight', description: 'Weight gain, weight loss, weight management', icon: 'scale-outline', color: '#E0554F', bg: '#FDE3E3' },
  { id: 'water', label: 'Water', description: 'Water & liquids', icon: 'water-outline', color: '#3E7BFA', bg: '#E3F0FD' },
  { id: 'steps', label: 'Steps', description: 'Steps & jogs', icon: 'walk-outline', color: '#2ED47A', bg: '#DCFCE7' },
  { id: 'period', label: 'Period', description: 'Period tracking', icon: 'water', color: '#E0568F', bg: '#FCE3EE' },
  { id: 'games', label: 'Games', description: 'Games & fun', icon: 'game-controller-outline', color: '#7C5CFC', bg: '#EDE9FE' },
  { id: 'finance', label: 'Finance', description: 'Finance & savings', icon: 'cash-outline', color: '#2ED47A', bg: '#DCFCE7' },
  { id: 'sports', label: 'Sports', description: 'Sports & activities', icon: 'trophy-outline', color: '#E8A33D', bg: '#FDECC8' },
  { id: 'business', label: 'Business', description: 'Business & career', icon: 'briefcase-outline', color: '#3E7BFA', bg: '#E3F0FD' },
  { id: 'education', label: 'Education', description: 'Education & learning', icon: 'school-outline', color: '#7C5CFC', bg: '#EDE9FE' },
  { id: 'calories-macros', label: 'Calories & Macros', description: 'Calories, macros & nutrition', icon: 'nutrition-outline', color: '#E0554F', bg: '#FDE3E3' },
  { id: 'entertainment', label: 'Entertainment', description: 'Movies, music & more', icon: 'film-outline', color: '#E0568F', bg: '#FCE3EE' },
  { id: 'fasting', label: 'Fasting', description: 'Intermittent & extended fasting', icon: 'flash-outline', color: '#B9773A', bg: '#F1E5D3' },
  { id: 'pregnancy', label: 'Pregnancy', description: 'Pregnancy & maternity', icon: 'body-outline', color: '#3FA383', bg: '#E4F2EC' },
  { id: 'other', label: 'Other', description: 'Other topics', icon: 'ellipsis-horizontal-circle-outline', color: '#8B8D97', bg: '#EEEEF1' },
];
