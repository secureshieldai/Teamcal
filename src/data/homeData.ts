export const currentUser = {
  name: 'You',
  avatar: 'https://i.pravatar.cc/150?img=12',
};

export const stories = [
  { id: 'power-squad', label: 'Power Squad', avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 'fit-fam', label: 'Fit Fam', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 'hustle-club', label: 'Hustle Club', avatar: 'https://i.pravatar.cc/150?img=51' },
];

export const todayProgress = {
  calories: 1620,
  calorieGoal: 2300,
  percent: 70,
  macros: [
    { key: 'protein', label: 'Protein', value: 120, goal: 160, color: 'macroProtein' as const },
    { key: 'carbs', label: 'Carbs', value: 160, goal: 220, color: 'macroCarbs' as const },
    { key: 'fat', label: 'Fat', value: 55, goal: 70, color: 'macroFat' as const },
  ],
};

export const statTiles = [
  { id: 'steps', icon: 'walk' as const, label: 'Steps', value: '7,842', goal: '/10,000' },
  { id: 'water', icon: 'water' as const, label: 'Water', value: '6 / 8', goal: 'cups' },
  { id: 'workouts', icon: 'barbell' as const, label: 'Workouts', value: '1 / 1', goal: 'done' },
  { id: 'fasting', icon: 'time' as const, label: 'Fasting', value: '14:32', goal: 'elapsed' },
];

export const friendsProgress = [
  { id: 'power-squad', name: 'Power Squad', isGroup: true, avatar: 'https://i.pravatar.cc/150?img=32', percent: null },
  { id: 'mike', name: 'Mike', avatar: 'https://i.pravatar.cc/150?img=13', calories: '1,820 kcal', percent: 80 },
  { id: 'lena', name: 'Lena', avatar: 'https://i.pravatar.cc/150?img=47', calories: '1,430 kcal', percent: 62 },
  { id: 'sarah', name: 'Sarah J.', avatar: 'https://i.pravatar.cc/150?img=45', calories: '1,650 kcal', percent: 72 },
];

export const coach = {
  name: 'Coach Mike',
  avatar: 'https://i.pravatar.cc/150?img=14',
  online: true,
  verified: true,
  lastMessage: {
    fromMe: false,
    text: "Sure! Let's make it even better.",
  },
  myLastMessage: 'Can you review my meal plan?',
  time: '10:30 AM',
  unreadCount: 3,
};

export const quickLogItems = [
  { id: 'scan', icon: 'camera' as const, label: 'Scan Meal' },
  { id: 'water', icon: 'water' as const, label: 'Log Water' },
  { id: 'workout', icon: 'barbell' as const, label: 'Workout' },
  { id: 'weight', icon: 'scale' as const, label: 'Weight' },
  { id: 'more', icon: 'ellipsis-horizontal' as const, label: 'More' },
];
