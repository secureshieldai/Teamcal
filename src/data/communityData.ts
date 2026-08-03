import type { Post } from '../components/PostCard';

export const socialTopTabs = ['Feed', 'Chats', 'Communities', 'Me'];
export const feedSubTabs = ['All', 'Blogs', 'Videos'];
export const chatsSubTabs = ['Messages', 'Requests'];
export const communitiesSubTabs = ['Groups', 'Challenges', 'Me'];
export const meSubTabs = ['Posts', 'Saved', 'Tagged'];

export const posts: Post[] = [
  {
    id: 'post-1',
    authorName: 'Fit Fam',
    authorAvatar: 'https://i.pravatar.cc/150?img=14',
    time: 'James K. • 3h ago',
    caption: 'New PR today! 5K in 24:31. Consistency is everything. \u{1F525}',
    photos: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80'],
    badge: '5K \u{1F525} New PR',
    likes: 98,
    comments: 18,
  },
  {
    id: 'post-2',
    authorName: 'Healthy Habits Club',
    authorAvatar: 'https://i.pravatar.cc/150?img=45',
    time: 'Ava R. • 1h ago',
    caption: 'Meal prepped for the week! Eating clean makes everything easier.',
    photos: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    ],
    likes: 74,
    comments: 12,
  },
];
