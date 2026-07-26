export const profileUser = {
  name: 'Sarah J.',
  handle: '@sarahj',
  avatar: 'https://i.pravatar.cc/150?img=45',
  level: 12,
  levelProgress: 68,
  points: '7,840',
};

export const profileStats = [
  { label: 'Posts', value: '1.2K' },
  { label: 'Following', value: '345' },
  { label: 'Followers', value: '2.8K' },
];

export const weekStats = [
  { label: 'Calories', value: '1,620', sub: '/2,300 kcal' },
  { label: 'Steps', value: '7,842', sub: '/10,000', percent: 78 },
  { label: 'Workouts', value: '5/6', sub: 'Complete', percent: 83 },
];

export const profileMenuItems = [
  { id: 'progress', icon: 'trending-up-outline' as const, label: 'My Progress' },
  { id: 'measurements', icon: 'resize-outline' as const, label: 'My Measurements' },
  { id: 'photos', icon: 'images-outline' as const, label: 'My Photos' },
  { id: 'achievements', icon: 'ribbon-outline' as const, label: 'My Achievements' },
  { id: 'marketplace', icon: 'storefront-outline' as const, label: 'Marketplace' },
  { id: 'rewards', icon: 'gift-outline' as const, label: 'Rewards' },
  { id: 'invite', icon: 'person-add-outline' as const, label: 'Invite Friends' },
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
];
