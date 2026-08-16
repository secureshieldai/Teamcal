export type MoodLevel = 'great' | 'good' | 'okay' | 'low' | 'rough';

export const MOOD_SCALE: { id: MoodLevel; label: string; emoji: string; score: number }[] = [
  { id: 'great', label: 'Great', emoji: '😄', score: 5 },
  { id: 'good', label: 'Good', emoji: '🙂', score: 4 },
  { id: 'okay', label: 'Okay', emoji: '😐', score: 3 },
  { id: 'low', label: 'Low', emoji: '🙁', score: 2 },
  { id: 'rough', label: 'Rough', emoji: '😣', score: 1 },
];

export const WRITE_PROMPTS = [
  "What's one thing you're grateful for today?",
  'What did your body ask you for today?',
  'What derailed you from your goals today?',
  'Describe your fast today in one sentence.',
  'Who or what supported you today?',
  'What did you avoid, and why?',
  'One win from today, no matter how small.',
];

export const LIVE_CALL_QUESTIONS = [
  "Hey, I'm here. Take a breath — how are you actually feeling right now?",
  "What's one thing you're grateful for today?",
  'What did your body ask you for today?',
  'What derailed you from your goals today?',
  'Who or what supported you today?',
  'What did you avoid, and why?',
  'One win from today, no matter how small — tell me about it.',
];
