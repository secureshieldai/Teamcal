export const powerSquad = {
  cover: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  name: 'Power Squad',
  memberCount: 24,
  description: 'We show up for each other, we push each other, we win together. \u{1F4AA}',
  members: [
    'https://i.pravatar.cc/150?img=13',
    'https://i.pravatar.cc/150?img=47',
    'https://i.pravatar.cc/150?img=45',
    'https://i.pravatar.cc/150?img=14',
  ],
};

export const groupActions = [
  { id: 'chat', icon: 'chatbubble-outline' as const, label: 'Chat' },
  { id: 'workouts', icon: 'barbell-outline' as const, label: 'Workouts' },
  { id: 'challenges', icon: 'trophy-outline' as const, label: 'Challenges' },
  { id: 'leaderboards', icon: 'stats-chart-outline' as const, label: 'Leaderboards' },
];

export const groupActivity = [
  {
    id: 'activity-1',
    name: 'Mike L.',
    avatar: 'https://i.pravatar.cc/150?img=13',
    time: '2h ago',
    caption: 'Log Day Destroyed! \u{1F525}\u{1F4AA}',
    likes: 24,
    comments: 6,
  },
];
