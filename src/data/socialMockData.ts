export type BlogBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; uri: string }
  | { type: 'tip'; image: string; question: string; answer: string }
  | { type: 'quote'; text: string };

export interface MockBlogComment {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  time: string;
  text: string;
  likes: number;
}

export interface MockBlogPost {
  id: string;
  image: string;
  title: string;
  category: string;
  author: string;
  authorAvatar: string;
  authorVerified?: boolean;
  date: string;
  readMinutes: number;
  likes: number;
  commentCount: number;
  featured?: boolean;
  body: BlogBlock[];
  comments: MockBlogComment[];
}

export const mockBlogPosts: MockBlogPost[] = [
  {
    id: 'blog-1',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    title: 'How I Beat Sugar Cravings (Without Giving Up My Favorites)',
    category: 'Nutrition',
    author: 'Sana R.',
    authorAvatar: 'https://i.pravatar.cc/150?img=45',
    authorVerified: true,
    date: 'May 18, 2025',
    readMinutes: 5,
    likes: 189,
    commentCount: 26,
    featured: true,
    body: [
      { type: 'paragraph', text: 'For years I thought cravings were my enemy. Then I learned they were just signals—messages from my body and mind trying to tell me something.' },
      { type: 'paragraph', text: "I used to believe the only way to \u{201C}eat healthy\u{201D} was to cut out all sugar and the foods I loved. But that mindset kept me stuck in a cycle of restriction, bingeing, and guilt." },
      { type: 'paragraph', text: "Here's how I finally broke free\u{2014}and you can too." },
      { type: 'heading', text: '1. Understand What Cravings Really Are' },
      { type: 'paragraph', text: "Cravings aren't about willpower. They're usually triggered by:" },
      { type: 'list', items: ['Blood sugar imbalances', 'Emotional stress', 'Lack of sleep', 'Dehydration'] },
      { type: 'image', uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80' },
      { type: 'heading', text: "2. Don't Fight Cravings—Work With Them" },
      { type: 'paragraph', text: 'Instead of cutting things out completely, I started satisfying my cravings in smarter ways.' },
      { type: 'heading', text: '3. My Go-To Craving Fixes' },
      { type: 'paragraph', text: 'When cravings hit, these simple swaps help me stay on track without feeling deprived.' },
      { type: 'tip', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80', question: 'Want something sweet?', answer: 'Try Greek yogurt with honey and berries.' },
      { type: 'tip', image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=200&q=80', question: 'Want something crunchy?', answer: 'Try air-popped popcorn with a pinch of sea salt.' },
      { type: 'tip', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200&q=80', question: 'Want chocolate?', answer: 'Try 2 squares of dark chocolate with almond butter.' },
      { type: 'heading', text: '4. Practice Self-Compassion' },
      { type: 'paragraph', text: "There will be days you overdo it—and that's okay. What matters is how you respond, not perfection." },
      { type: 'quote', text: "Progress, not perfection. One choice won't make you unhealthy, just like one choice won't make you healthy." },
      { type: 'heading', text: 'Closing Thoughts' },
      { type: 'paragraph', text: "Cravings don't have to control you. When you understand them and respond with balance instead of restriction, you can enjoy your favorites and still reach your goals." },
      { type: 'paragraph', text: "What's your go-to way to manage cravings? Share in the comments below! \u{1F447}" },
    ],
    comments: [
      { id: 'c1', name: 'Maya K.', avatar: 'https://i.pravatar.cc/150?img=32', time: '45m', text: 'This was so helpful! The popcorn tip is a game changer for me. \u{1F64F}', likes: 12 },
      { id: 'c2', name: 'Coach Ben', avatar: 'https://i.pravatar.cc/150?img=13', verified: true, time: '32m', text: 'Great read, Sana! Education and awareness always win.', likes: 8 },
      { id: 'c3', name: 'Luca P.', avatar: 'https://i.pravatar.cc/150?img=51', time: '1h', text: 'I used to feel guilty after eating sweets, but now I practice balance like you said. It works!', likes: 6 },
      { id: 'c4', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=47', time: '2h', text: 'Definitely trying the yogurt + honey combo tonight.', likes: 3 },
      { id: 'c5', name: 'Ravi', avatar: 'https://i.pravatar.cc/150?img=53', time: '3h', text: 'Dehydration being a craving trigger blew my mind. Drinking more water now.', likes: 4 },
      { id: 'c6', name: 'Dr. Amelia', avatar: 'https://i.pravatar.cc/150?img=48', verified: true, time: '4h', text: 'Well-explained! Blood sugar swings really are the biggest hidden driver here.', likes: 9 },
    ],
  },
  {
    id: 'blog-2',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
    title: 'The Truth About Processed Foods (and What to Do Instead)',
    category: 'Nutrition',
    author: 'Coach Ben',
    authorAvatar: 'https://i.pravatar.cc/150?img=13',
    authorVerified: true,
    date: 'May 10, 2025',
    readMinutes: 6,
    likes: 142,
    commentCount: 14,
    body: [
      { type: 'paragraph', text: "\u{201C}Processed\u{201D} gets a bad reputation, but not all processed foods are created equal. Understanding the difference is the key to eating well without the guilt." },
      { type: 'heading', text: 'Minimally Processed vs. Ultra-Processed' },
      { type: 'paragraph', text: 'Frozen vegetables, canned beans, and plain yogurt are technically processed, but they hold onto most of their nutrition. Ultra-processed foods—packed with additives, refined sugar, and stripped fiber—are the real concern.' },
      { type: 'list', items: ['Read the ingredient list, not just the label', 'Fewer, recognizable ingredients is a good sign', 'Fiber and protein content matter more than "low fat" claims'] },
      { type: 'heading', text: 'What to Do Instead' },
      { type: 'paragraph', text: 'Swap ultra-processed snacks for whole-food versions you already enjoy: nuts instead of chips, fruit instead of candy, and home-cooked meals a few extra nights a week.' },
      { type: 'heading', text: 'Closing Thoughts' },
      { type: 'paragraph', text: "Small, consistent swaps beat all-or-nothing overhauls every time." },
    ],
    comments: [
      { id: 'c1', name: 'Sana R.', avatar: 'https://i.pravatar.cc/150?img=45', verified: true, time: '1h', text: 'The ingredient-list tip is so underrated. Simple but powerful.', likes: 5 },
      { id: 'c2', name: 'Maya K.', avatar: 'https://i.pravatar.cc/150?img=32', time: '3h', text: 'Needed this reminder today!', likes: 2 },
    ],
  },
  {
    id: 'blog-3',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80',
    title: 'Why Morning Routines Change Everything',
    category: 'Lifestyle',
    author: 'Maya K.',
    authorAvatar: 'https://i.pravatar.cc/150?img=32',
    date: 'May 6, 2025',
    readMinutes: 4,
    likes: 98,
    commentCount: 9,
    body: [
      { type: 'paragraph', text: "The first 30 minutes of my day used to be chaos—phone in hand, rushing out the door. Building a simple morning routine changed how the rest of my day feels." },
      { type: 'heading', text: 'What My Routine Looks Like' },
      { type: 'list', items: ['Wake up without checking my phone', '10 minutes of stretching', 'A glass of water before coffee', 'Write down 3 priorities for the day'] },
      { type: 'heading', text: 'Why It Works' },
      { type: 'paragraph', text: "It's not about waking up at 5am or doing an hour of yoga. It's about starting the day on your own terms instead of reacting to notifications." },
      { type: 'heading', text: 'Closing Thoughts' },
      { type: 'paragraph', text: 'Start with one small habit. The rest builds from there.' },
    ],
    comments: [
      { id: 'c1', name: 'Luca P.', avatar: 'https://i.pravatar.cc/150?img=51', time: '2h', text: 'The "no phone" rule is the hardest part for me honestly.', likes: 4 },
    ],
  },
  {
    id: 'blog-4',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&q=80',
    title: 'High-Protein Meals That Actually Taste Amazing',
    category: 'Nutrition',
    author: 'Luca P.',
    authorAvatar: 'https://i.pravatar.cc/150?img=51',
    date: 'April 29, 2025',
    readMinutes: 6,
    likes: 176,
    commentCount: 21,
    body: [
      { type: 'paragraph', text: "High-protein doesn't have to mean bland chicken and rice on repeat. Here are the meals I actually look forward to eating." },
      { type: 'heading', text: 'Breakfast' },
      { type: 'paragraph', text: 'Greek yogurt bowls with granola, berries, and a scoop of protein powder—ready in two minutes.' },
      { type: 'heading', text: 'Lunch' },
      { type: 'paragraph', text: 'A big grain bowl: quinoa, grilled chicken or tofu, roasted vegetables, and a tahini drizzle.' },
      { type: 'heading', text: 'Dinner' },
      { type: 'paragraph', text: 'Sheet-pan salmon with sweet potato and broccoli—one pan, minimal cleanup.' },
      { type: 'heading', text: 'Closing Thoughts' },
      { type: 'paragraph', text: 'Protein goals are so much easier to hit when the food is something you actually crave.' },
    ],
    comments: [
      { id: 'c1', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=47', time: '5h', text: 'Making the salmon tonight!', likes: 7 },
      { id: 'c2', name: 'Ravi', avatar: 'https://i.pravatar.cc/150?img=53', time: '6h', text: 'The grain bowl is my go-to meal prep now.', likes: 3 },
    ],
  },
  {
    id: 'blog-5',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80',
    title: 'Detox Myths You Should Stop Believing',
    category: 'Mindset',
    author: 'Dr. Amelia',
    authorAvatar: 'https://i.pravatar.cc/150?img=48',
    authorVerified: true,
    date: 'April 21, 2025',
    readMinutes: 5,
    likes: 210,
    commentCount: 33,
    body: [
      { type: 'paragraph', text: "\u{201C}Detox\u{201D} teas, juice cleanses, and \u{201C}cheat day resets\u{201D}—as a physician, these are the myths I get asked about most. Let's clear them up." },
      { type: 'heading', text: 'Myth: You Need to "Detox" Your Body' },
      { type: 'paragraph', text: 'Your liver and kidneys already do this job continuously. No tea or juice speeds that process up.' },
      { type: 'heading', text: 'Myth: Sweating Removes Toxins' },
      { type: 'paragraph', text: 'Sweat is mostly water and electrolytes, not toxins. Sauna sessions feel great, but they are not a detox mechanism.' },
      { type: 'heading', text: 'What Actually Helps' },
      { type: 'list', items: ['Consistent sleep', 'Enough fiber and water', 'Limiting alcohol', 'Regular movement'] },
      { type: 'heading', text: 'Closing Thoughts' },
      { type: 'paragraph', text: 'Your body is built to detox itself. Support it with the basics instead of chasing quick fixes.' },
    ],
    comments: [
      { id: 'c1', name: 'Coach Ben', avatar: 'https://i.pravatar.cc/150?img=13', verified: true, time: '10h', text: 'Wish more people saw this before buying another "detox tea".', likes: 15 },
      { id: 'c2', name: 'Sana R.', avatar: 'https://i.pravatar.cc/150?img=45', verified: true, time: '12h', text: 'So glad a doctor is saying this plainly.', likes: 11 },
    ],
  },
];

export interface MockVideo {
  id: string;
  thumbnail: string;
  title: string;
  author: string;
  authorAvatar: string;
  time: string;
  views?: string;
  duration: string;
  caption?: string;
  likes?: number;
  comments?: number;
  hero?: boolean;
}

export const mockVideos: MockVideo[] = [
  {
    id: 'video-1',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    title: 'Battle ropes for fat burn',
    author: 'Coach Ben',
    authorAvatar: 'https://i.pravatar.cc/150?img=13',
    time: '4h ago',
    duration: '00:45',
    caption: 'Battle ropes for fat burn \u{1F525} Try this 30-sec finisher!',
    likes: 342,
    comments: 41,
    hero: true,
  },
  {
    id: 'video-2',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
    title: '5 Foods That Boost Metabolism Naturally',
    author: 'Maya K.',
    authorAvatar: 'https://i.pravatar.cc/150?img=32',
    time: '2h ago',
    views: '12K views',
    duration: '03:20',
  },
  {
    id: 'video-3',
    thumbnail: 'https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=300&q=80',
    title: '10 Min Full Body HIIT Workout',
    author: 'Luca P.',
    authorAvatar: 'https://i.pravatar.cc/150?img=51',
    time: '5h ago',
    views: '8.7K views',
    duration: '10:15',
  },
  {
    id: 'video-4',
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    title: 'What I Eat in a Day (High Protein)',
    author: 'Sana R.',
    authorAvatar: 'https://i.pravatar.cc/150?img=45',
    time: '7h ago',
    views: '6.2K views',
    duration: '06:35',
  },
];

export interface MockConversation {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  streakDays: number;
  summary: string;
  unreadCount?: number;
}

export const mockConversations: MockConversation[] = [
  { id: 'conv-1', name: 'Maya K.', avatar: 'https://i.pravatar.cc/150?img=32', online: true, streakDays: 12, summary: '1,820 kcal \u{2022} 8,432 steps', unreadCount: 2 },
  { id: 'conv-2', name: 'Coach Ben', avatar: 'https://i.pravatar.cc/150?img=13', online: true, streakDays: 34, summary: '1,430 kcal \u{2022} 6,210 steps' },
  { id: 'conv-3', name: 'Sana R.', avatar: 'https://i.pravatar.cc/150?img=45', online: true, streakDays: 5, summary: '1,650 kcal \u{2022} 7,842 steps', unreadCount: 1 },
  { id: 'conv-4', name: 'Luca P.', avatar: 'https://i.pravatar.cc/150?img=51', online: true, streakDays: 21, summary: '1,210 kcal \u{2022} 5,980 steps' },
  { id: 'conv-5', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=47', online: true, streakDays: 8, summary: '980 kcal \u{2022} 4,120 steps' },
];

export interface MockMessageRequest {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

export const mockMessageRequests: MockMessageRequest[] = [
  { id: 'req-1', name: 'Dr. Amelia', handle: '@dramelia', avatar: 'https://i.pravatar.cc/150?img=48' },
  { id: 'req-2', name: 'Ravi', handle: '@ravifasts', avatar: 'https://i.pravatar.cc/150?img=53' },
];
