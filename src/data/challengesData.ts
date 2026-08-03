export const challengeTabs = ['My Challenges', 'Find Challenges', 'Past Challenges'];

export const challengeTypes = [
  { id: 'steps', label: 'Steps', icon: 'walk' as const, color: '#FF6A2B', unit: 'steps' },
  { id: 'weight-loss', label: 'Weight Loss', icon: 'trending-down' as const, color: '#2ED47A', unit: 'lbs' },
  { id: 'water', label: 'Water Intake', icon: 'water' as const, color: '#3E7BFA', unit: 'glasses' },
  { id: 'workout', label: 'Workout', icon: 'barbell' as const, color: '#8B5CF6', unit: 'workouts' },
  { id: 'calories', label: 'Calories', icon: 'flame' as const, color: '#FF4D5E', unit: 'kcal' },
  { id: 'custom', label: 'Custom', icon: 'star' as const, color: '#14B8A6', unit: 'points' },
];

export const durationPresets = [7, 14, 21, 30];

export const featuredChallenge = {
  photo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  title: '30 Day Transformation Challenge',
  joinedCount: '24,531',
  day: 12,
  totalDays: 30,
};

export const trendingChallenges = [
  { id: 'steps', icon: 'walk' as const, iconColor: '#FF6A2B', title: '10K Steps Daily', duration: '7 days', joinedCount: '8.9K' },
  { id: 'hydration', icon: 'water' as const, iconColor: '#3E7BFA', title: 'Hydration Hero', duration: '14 days', joinedCount: '6.2K' },
  { id: 'plank', icon: 'body' as const, iconColor: '#2ED47A', title: 'Plank Master', duration: '7 days', joinedCount: '4.3K' },
];
