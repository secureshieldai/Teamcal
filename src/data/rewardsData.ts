export const rewardsPoints = '2,450';

export const rewardsList = [
  { id: 'checkin', icon: 'checkmark-circle-outline' as const, label: 'Daily Check-in', points: '+10', done: true },
  { id: 'log-meals', icon: 'restaurant-outline' as const, label: 'Log Meals', points: '+20', done: true },
  { id: 'invite', icon: 'person-add-outline' as const, label: 'Invite a Friend', points: '+100', done: false },
  { id: 'challenge', icon: 'trophy-outline' as const, label: 'Join Challenge', points: '+50', done: false },
  { id: 'share', icon: 'share-social-outline' as const, label: 'Share Progress', points: '+25', done: false },
];
