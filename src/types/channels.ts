export type ChannelRole = 'owner' | 'admin' | 'moderator' | 'follower';
export type ChannelCategory = 'wellness' | 'fitness' | 'nutrition' | 'mindfulness' | 'lifestyle' | 'education' | 'news' | 'entertainment' | 'sports' | 'business' | 'technology' | 'general';
export type PostContentType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'link' | 'poll' | 'announcement';

export type Channel = {
  id: string;
  owner_id: string;
  name: string;
  username: string;
  description: string;
  avatar: string | null;
  cover_image: string | null;
  category: ChannelCategory;
  rules: string;
  is_public: boolean;
  allow_comments: boolean;
  allow_reactions: boolean;
  allow_sharing: boolean;
  allow_downloads: boolean;
  follower_count: number;
  post_count: number;
  is_monetized: boolean;
  monetization_approved_at: string | null;
  revenue_share_percent: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  isFollowing?: boolean;
  memberRole?: ChannelRole | null;
};

export type ChannelMember = {
  id: string;
  channel_id: string;
  user_id: string;
  role: ChannelRole;
  can_post: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_pin: boolean;
  can_moderate: boolean;
  can_manage: boolean;
  followed_at: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
};

export type ChannelPost = {
  id: string;
  channel_id: string;
  author_id: string;
  content_type: PostContentType;
  text_content: string | null;
  media_url: string | null;
  link_url: string | null;
  link_title: string | null;
  link_image: string | null;
  poll_data: PollData | null;
  poll_ends_at: string | null;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  channel?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  myReaction?: string | null;
};

export type PollData = {
  question: string;
  options: PollOption[];
};

export type PollOption = {
  text: string;
  votes: number;
};

export type PostReaction = {
  id: string;
  post_id: string;
  user_id: string;
  emoji: '👍' | '❤️' | '😂' | '🙏' | '😢' | '😮' | '🔥';
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replies?: PostComment[];
};

export type ChannelAnalytics = {
  daily: DailyAnalytics[];
  totals: {
    new_followers: number;
    unfollows: number;
    post_views: number;
    reactions: number;
    comments: number;
    shares: number;
    net_followers: number;
    engagement_rate: number;
  };
  current_followers: number;
};

export type DailyAnalytics = {
  id: string;
  channel_id: string;
  date: string;
  new_followers: number;
  unfollows: number;
  post_views: number;
  reactions: number;
  comments: number;
  shares: number;
  ad_impressions: number;
  ad_clicks: number;
  ad_revenue_usd: number;
  creator_revenue_usd: number;
};

export type ChannelReport = {
  id: string;
  channel_id?: string;
  post_id?: string;
  reporter_id: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
};

export const CHANNEL_CATEGORIES: { id: ChannelCategory; label: string; icon: string }[] = [
  { id: 'wellness', label: 'Wellness', icon: 'heart-outline' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell-outline' },
  { id: 'nutrition', label: 'Nutrition', icon: 'nutrition-outline' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'flower-outline' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'sunny-outline' },
  { id: 'education', label: 'Education', icon: 'school-outline' },
  { id: 'news', label: 'News', icon: 'newspaper-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'technology', label: 'Technology', icon: 'hardware-chip-outline' },
  { id: 'general', label: 'General', icon: 'albums-outline' },
];

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🙏', '😢', '😮', '🔥'] as const;

export const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or hate speech',
  'Violence or dangerous content',
  'Adult content',
  'Copyright violation',
  'False information',
  'Other',
];
