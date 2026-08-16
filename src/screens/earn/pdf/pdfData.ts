// Shared data for all 6 PDF creation flows

export const PDF_CATEGORIES = [
  'Calorie & Macros', 'Nutrition', 'Weight Loss', 'Weight Gain',
  'Fitness & Workouts', 'Steps & Jogging', 'Hydration', 'Meal Prep',
  'Food & Recipes', 'Healthy Living', 'Sleep', 'Fasting',
  "Women's Health", 'Personal Development', 'Education', 'Productivity',
  'Career & Business', 'Finance', 'Relationships', 'Beauty & Self-Care',
  'Fashion', 'Travel', 'Entertainment', 'Games', 'Sports', 'Technology',
  'Music', 'Lifestyle', 'Motivation & Inspiration', 'Parenting & Family',
  'Arts & Creativity', 'Other',
] as const;

export type PdfCategory = typeof PDF_CATEGORIES[number];

export type BuyerPreviewType = 'first-pages' | 'specific-pages' | 'custom-content' | 'no-preview';

export const BUYER_PREVIEW_OPTIONS: { key: BuyerPreviewType; label: string; description: string }[] = [
  { key: 'first-pages',    label: 'Preview first pages',    description: 'Buyers can read the first N pages.' },
  { key: 'specific-pages', label: 'Choose specific pages',  description: 'Select exact pages buyers can preview.' },
  { key: 'custom-content', label: 'Custom preview content', description: 'Upload or write custom preview content.' },
  { key: 'no-preview',     label: 'No preview',             description: 'Buyers see only title and description.' },
];

export const AI_TONES = ['Professional', 'Conversational', 'Educational', 'Inspirational', 'Bold', 'Friendly'] as const;
export const AI_LENGTHS = ['Short (5–10 pages)', 'Medium (15–25 pages)', 'Long (30–50 pages)', 'Comprehensive (50+ pages)'] as const;

export const AI_QUICK_ACTIONS = [
  { key: 'write',   label: 'Write content for my PDF',     icon: 'create-outline',        color: '#8B5CF6' },
  { key: 'outline', label: 'Create an outline for my PDF', icon: 'list-outline',           color: '#F59E0B' },
  { key: 'intro',   label: 'Write an engaging introduction', icon: 'chatbubble-quote-outline', color: '#3B82F6' },
  { key: 'titles',  label: 'Suggest titles for my PDF',    icon: 'document-outline',       color: '#EC4899' },
  { key: 'image',   label: 'Generate image for my PDF',    icon: 'image-outline',          color: '#10B981' },
  { key: 'improve', label: 'Improve existing content',     icon: 'sparkles-outline',       color: '#6366F1' },
] as const;

export type Chapter = {
  id: string;
  title: string;
  content: string; // plain text with simple markdown-like tokens
  images: string[];
};
