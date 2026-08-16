// Shared data for all 6 video creation flows

export const VIDEO_CATEGORIES = [
  'Calorie & Macros', 'Nutrition', 'Weight Loss', 'Weight Gain',
  'Fitness & Workouts', 'Steps & Jogging', 'Hydration', 'Meal Prep',
  'Food & Recipes', 'Healthy Living', 'Sleep', 'Fasting',
  "Women's Health", 'Personal Development', 'Education', 'Productivity',
  'Career & Business', 'Finance', 'Relationships', 'Beauty & Self-Care',
  'Fashion', 'Travel', 'Entertainment', 'Games', 'Sports', 'Technology',
  'Music', 'Lifestyle', 'Motivation & Inspiration', 'Parenting & Family',
  'Arts & Creativity', 'Other',
] as const;

export type VideoCategory = typeof VIDEO_CATEGORIES[number];

export type MonetizationType = 'paid' | 'ad-based' | 'ppv' | 'earn-per-complete';

export const MONETIZATION_OPTIONS: { key: MonetizationType; label: string; description: string; icon: string }[] = [
  { key: 'paid', label: 'Paid Video (One-Time Purchase)', description: 'Viewers pay once to unlock and watch the full video.', icon: 'lock-closed' },
  { key: 'ad-based', label: 'Ad-Based Earnings', description: 'Earn money from ads shown during your video.', icon: 'play-circle' },
  { key: 'ppv', label: 'Pay Per View (PPV)', description: 'Charge a set amount every time someone watches your video.', icon: 'eye' },
  { key: 'earn-per-complete', label: 'Earn Per Complete View', description: 'Earn a fixed amount when viewers watch the video to the end.', icon: 'checkmark-circle' },
];

export type PreviewType = 'none' | 'first-30' | 'custom-range' | 'custom-upload';

export const PREVIEW_OPTIONS: { key: PreviewType; label: string; description: string }[] = [
  { key: 'none', label: 'No Preview', description: 'Viewers see nothing before purchase.' },
  { key: 'first-30', label: 'Use first 30 seconds of trailer', description: 'Viewers can preview the first 30 seconds.' },
  { key: 'custom-range', label: 'Custom time range', description: 'Set a custom start and end time.' },
  { key: 'custom-upload', label: 'Upload custom preview', description: 'Upload a separate preview video.' },
];

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic',
  'Hindi', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Russian', 'Other',
];
