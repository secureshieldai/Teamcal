export type DateRangeKey = '7d' | '30d' | '90d' | '6m' | '1y' | 'lifetime';

export const dateRangeOptions: { key: DateRangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: '6m', label: 'Last 6 Months' },
  { key: '1y', label: 'Last 1 Year' },
  { key: 'lifetime', label: 'Lifetime' },
];

export const earnSummary = {
  balance: 48.4,
  lifetimeEarnings: 48240.8,
  last30Days: 2840.6,
  availableBalance: 48.4,
  pendingEarnings: 124.6,
  totalWithdrawn: 12540.0,
};

export type EarningSource = { key: string; label: string; value: number; color: string };

export const earningsBySource: EarningSource[] = [
  { key: 'blogs', label: 'Blogs', value: 17540.8, color: '#3E7BFA' },
  { key: 'pdfs', label: 'PDFs', value: 9220.5, color: '#FF6A2B' },
  { key: 'videos', label: 'Videos', value: 11458.2, color: '#2ED47A' },
  { key: 'stores', label: 'Stores', value: 6840.1, color: '#FFC542' },
  { key: 'memberships', label: 'Memberships', value: 4210.1, color: '#8B5CF6' },
  { key: 'rewards', label: 'Creator Rewards', value: 3568.6, color: '#14B8A6' },
  { key: 'contests', label: 'Contests / Challenges', value: 1000.0, color: '#FF4D5E' },
  { key: 'other', label: 'Other', value: 564.0, color: '#A6A8B3' },
];

export const earningsTrend = {
  labels: ['May 20', 'May 27', 'Jun 3', 'Jun 10', 'Jun 17'],
  metrics: {
    Earnings: [1200, 1850, 1600, 2840, 2340],
    Views: [8200, 9600, 8800, 12400, 11200],
    Sales: [42, 58, 51, 74, 66],
    Subscribers: [1820, 1902, 1988, 2104, 2184],
  } as Record<string, number[]>,
};

export type TopContentType = 'Blog' | 'PDF' | 'Video' | 'Product' | 'Membership';

export type TopContentItem = {
  id: string;
  title: string;
  type: TopContentType;
  thumbnail: string;
  views: number;
  clicks: number;
  sales: number;
  earned: number;
  date: string;
};

export const topPerformingContent: TopContentItem[] = [
  { id: 'tc-1', title: 'My 21-day fast - full guide', type: 'Blog', thumbnail: 'https://picsum.photos/seed/fast21/300/200', views: 12400, clicks: 2100, sales: 184, earned: 486.0, date: 'May 19, 2026' },
  { id: 'tc-2', title: 'Fasting for Beginners', type: 'PDF', thumbnail: 'https://picsum.photos/seed/fastbeginners/300/200', views: 8600, clicks: 1400, sales: 152, earned: 392.8, date: 'May 12, 2026' },
  { id: 'tc-3', title: 'How I lost 25kg in 5 months', type: 'Video', thumbnail: 'https://picsum.photos/seed/lost25kg/300/200', views: 28700, clicks: 3200, sales: 276, earned: 724.6, date: 'May 8, 2026' },
  { id: 'tc-4', title: 'Protein Powder (2x)', type: 'Product', thumbnail: 'https://picsum.photos/seed/proteinpowder/300/200', views: 4100, clicks: 620, sales: 96, earned: 210.4, date: 'Apr 30, 2026' },
  { id: 'tc-5', title: 'Premium Health Community', type: 'Membership', thumbnail: 'https://picsum.photos/seed/healthcommunity/300/200', views: 5600, clicks: 940, sales: 128, earned: 640.0, date: 'Apr 22, 2026' },
];

export type TransactionType = 'Blog Earnings' | 'PDF Purchase' | 'Video Purchase' | 'Store Order' | 'Membership Payment' | 'Referral Commission' | 'Withdrawal';
export type TransactionStatus = 'Completed' | 'Pending' | 'Processing' | 'Failed';

export type Transaction = {
  id: string;
  title: string;
  type: TransactionType;
  date: string;
  status: TransactionStatus;
  amount: number;
  source: string;
};

export const recentTransactions: Transaction[] = [
  { id: 'tx-1', title: 'Blog Post Earnings', type: 'Blog Earnings', date: 'Today, 10:24 AM', status: 'Completed', amount: 18.4, source: 'My 21-day fast - full guide' },
  { id: 'tx-2', title: 'PDF Purchase', type: 'PDF Purchase', date: 'Today, 09:35 AM', status: 'Completed', amount: 9.9, source: 'Fasting for Beginners' },
  { id: 'tx-3', title: 'Video Purchase', type: 'Video Purchase', date: 'Yesterday, 11:30 PM', status: 'Completed', amount: 24.0, source: 'How I lost 25kg in 5 months' },
  { id: 'tx-4', title: 'Store Order', type: 'Store Order', date: 'Yesterday, 08:45 PM', status: 'Completed', amount: 56.0, source: 'Protein Powder (2x)' },
  { id: 'tx-5', title: 'Membership Payment', type: 'Membership Payment', date: 'Yesterday, 07:20 PM', status: 'Completed', amount: 20.0, source: 'Premium Health Community' },
  { id: 'tx-6', title: 'Referral Commission', type: 'Referral Commission', date: '2 days ago', status: 'Pending', amount: 6.2, source: 'Referral · Sarah J.' },
];

export type WithdrawalStatus = 'Completed' | 'Processing' | 'Failed' | 'Reversed';

export type WithdrawalRecord = {
  id: string;
  amount: number;
  date: string;
  status: WithdrawalStatus;
  method: string;
  reference: string;
};

export const withdrawalHistory: WithdrawalRecord[] = [
  { id: 'wd-1', amount: 120.0, date: '22 Jul 2026, 03:30 PM', status: 'Completed', method: 'Stripe', reference: 'tr_1uBen...' },
  { id: 'wd-2', amount: 85.0, date: '10 Jul 2026, 08:15 AM', status: 'Completed', method: 'Stripe', reference: 'tr_7hy23...' },
  { id: 'wd-3', amount: 60.0, date: '01 Jul 2026, 11:45 AM', status: 'Processing', method: 'Stripe', reference: 'tr_6tu68...' },
  { id: 'wd-4', amount: 40.0, date: '20 Jun 2026, 05:20 PM', status: 'Failed', method: 'Stripe', reference: 'tr_8en77...' },
  { id: 'wd-5', amount: 75.0, date: '05 Jun 2026, 09:10 AM', status: 'Completed', method: 'Stripe', reference: 'tr_3ka07...' },
];

export const payoutMethod = {
  connected: false,
  provider: 'Stripe',
  email: '',
  country: '',
  currency: 'USD',
};

export const withdrawSettings = {
  minimumWithdrawal: 10.0,
  feeFlat: 1.0,
};

export type BlogStatus = 'Draft' | 'Published' | 'Paused' | 'Under Review';

export type Blog = {
  id: string;
  name: string;
  url: string;
  category: string;
  cover: string;
  status: BlogStatus;
  posts: number;
  views: number;
  earned: number;
  followers: number;
  updated: string;
  description: string;
};

export const blogs: Blog[] = [
  { id: 'blog-1', name: 'Wellness Daily', url: 'wellnessdaily.teamcal.blog', category: 'Health & Wellness', cover: 'https://picsum.photos/seed/wellnessdaily/500/280', status: 'Published', posts: 18, views: 45200, earned: 2120.4, followers: 2184, updated: 'May 19, 2026', description: 'Daily tips, guides and inspiration for a healthier, happier you.' },
  { id: 'blog-2', name: 'Mindset Matters', url: 'mindsetmatters.teamcal.blog', category: 'Personal Development', cover: 'https://picsum.photos/seed/mindsetmatters/500/280', status: 'Published', posts: 14, views: 32800, earned: 1240.8, followers: 1562, updated: 'May 18, 2026', description: 'Shifts, habits and stories that change how you think.' },
  { id: 'blog-3', name: 'Travel Stories', url: 'travelstories.teamcal.blog', category: 'Travel', cover: 'https://picsum.photos/seed/travelstories/500/280', status: 'Draft', posts: 10, views: 15600, earned: 849.4, followers: 896, updated: 'May 10, 2026', description: 'Budget travel guides and stories from around the world.' },
];

export type BlogPostStatus = 'Published' | 'Draft' | 'Scheduled';

export type BlogPostItem = {
  id: string;
  blogId: string;
  title: string;
  status: BlogPostStatus;
  views: number;
  readTime: string;
  earned: number;
  date: string;
  thumbnail: string;
};

export const blogPosts: BlogPostItem[] = [
  { id: 'bp-1', blogId: 'blog-1', title: '10 Morning Habits for a Healthy Life', status: 'Published', views: 2400, readTime: '5m 12s', earned: 86.4, date: 'May 19, 2026', thumbnail: 'https://picsum.photos/seed/morninghabits/300/200' },
  { id: 'bp-2', blogId: 'blog-1', title: 'How to Stay Motivated Every Day', status: 'Published', views: 1800, readTime: '4m 30s', earned: 72.1, date: 'May 18, 2026', thumbnail: 'https://picsum.photos/seed/staymotivated/300/200' },
  { id: 'bp-3', blogId: 'blog-2', title: 'Top 5 Budget Travel Destinations', status: 'Published', views: 1600, readTime: '6m 05s', earned: 64.8, date: 'May 16, 2026', thumbnail: 'https://picsum.photos/seed/budgettravel/300/200' },
  { id: 'bp-4', blogId: 'blog-2', title: 'Mindset Shifts That Change Your Life', status: 'Draft', views: 0, readTime: '4m 40s', earned: 0, date: 'May 14, 2026', thumbnail: 'https://picsum.photos/seed/mindsetshifts/300/200' },
];

export const blogPerformanceTrend = {
  labels: ['May 20', 'May 27', 'Jun 3', 'Jun 10', 'Jun 17'],
  views: [3200, 3600, 3900, 4400, 4520],
  earnings: [1420, 1680, 1790, 2040, 2120],
  followers: [1980, 2020, 2080, 2140, 2184],
};

export type PdfStatus = 'Draft' | 'Processing' | 'Published' | 'Under Review';

export type PdfItem = {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  price: number;
  status: PdfStatus;
  previewViews: number;
  purchases: number;
  conversionRate: number;
  earned: number;
  rating: number;
  updated: string;
};

export const pdfs: PdfItem[] = [
  { id: 'pdf-1', title: 'The Productivity Blueprint', author: 'You', category: 'Personal Development', cover: 'https://picsum.photos/seed/productivityblueprint/300/400', price: 12.99, status: 'Published', previewViews: 3200, purchases: 256, conversionRate: 7.98, earned: 1920.4, rating: 4.7, updated: 'May 19, 2026' },
  { id: 'pdf-2', title: 'Financial Freedom Guide', author: 'You', category: 'Finance', cover: 'https://picsum.photos/seed/financialfreedom/300/400', price: 14.99, status: 'Published', previewViews: 5600, purchases: 392, conversionRate: 6.96, earned: 2884.8, rating: 4.8, updated: 'May 18, 2026' },
  { id: 'pdf-3', title: 'Healthy Eating Made Easy', author: 'You', category: 'Health & Wellness', cover: 'https://picsum.photos/seed/healthyeating/300/400', price: 9.99, status: 'Draft', previewViews: 812, purchases: 32, conversionRate: 3.94, earned: 176.0, rating: 4.3, updated: 'May 16, 2026' },
];

export type VideoStatus = 'Draft' | 'Published' | 'Scheduled' | 'Under Review';
export type VideoMonetization = 'Free' | 'One-time Purchase' | 'Series Purchase' | 'Subscription' | 'Creator Rewards';

export type VideoItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  monetization: VideoMonetization;
  thumbnail: string;
  status: VideoStatus;
  views: number;
  qualifiedViews: number;
  completion: number;
  earned: number;
  updated: string;
};

export const videos: VideoItem[] = [
  { id: 'vid-1', title: 'Morning Mindset Routine', subtitle: 'Episode 1 · The 5 AM Advantage', category: 'Self Improvement', monetization: 'Free', thumbnail: 'https://picsum.photos/seed/morningmindset/300/400', status: 'Published', views: 12400, qualifiedViews: 8200, completion: 64, earned: 0, updated: 'May 20, 2026' },
  { id: 'vid-2', title: '30 Day Home Workout Series', subtitle: '18 Episodes', category: 'Health & Fitness', monetization: 'Series Purchase', thumbnail: 'https://picsum.photos/seed/homeworkout/300/400', status: 'Published', views: 28600, qualifiedViews: 18300, completion: 71, earned: 2480.0, updated: 'May 15, 2026' },
  { id: 'vid-3', title: 'Investing for Beginners', subtitle: 'Full Course · 12 Lessons', category: 'Finance', monetization: 'Subscription', thumbnail: 'https://picsum.photos/seed/investingbeginners/300/400', status: 'Published', views: 9100, qualifiedViews: 6700, completion: 58, earned: 1960.0, updated: 'May 12, 2026' },
  { id: 'vid-4', title: 'Bali Travel Vlog', subtitle: 'Episode 2', category: 'Travel', monetization: 'Free', thumbnail: 'https://picsum.photos/seed/balitravel/300/400', status: 'Draft', views: 4300, qualifiedViews: 2800, completion: 48, earned: 0, updated: 'May 8, 2026' },
];

export type StoreStatus = 'Draft' | 'Published' | 'Paused' | 'Under Review';

export type StoreItem = {
  id: string;
  name: string;
  url: string;
  category: string;
  logo: string;
  status: StoreStatus;
  products: number;
  orders: number;
  customers: number;
  sales: number;
  earned: number;
  updated: string;
};

export const stores: StoreItem[] = [
  { id: 'store-1', name: 'Nourish Naturals', url: 'nourish-naturals.teamcal.store', category: 'Health & Wellness', logo: 'https://picsum.photos/seed/nourishnaturals/200/200', status: 'Published', products: 48, orders: 320, customers: 214, sales: 9840.6, earned: 4210.2, updated: 'Apr 18, 2026' },
  { id: 'store-2', name: 'Digital Edge Store', url: 'digital-edge.teamcal.store', category: 'Digital Products', logo: 'https://picsum.photos/seed/digitaledge/200/200', status: 'Published', products: 36, orders: 210, customers: 152, sales: 6420.0, earned: 2890.8, updated: 'Mar 22, 2026' },
  { id: 'store-3', name: 'Fitness Gear Pro', url: 'fitness-gear-pro.teamcal.store', category: 'Sports & Fitness', logo: 'https://picsum.photos/seed/fitnessgearpro/200/200', status: 'Paused', products: 28, orders: 178, customers: 124, sales: 5230.4, earned: 2357.8, updated: 'Feb 10, 2026' },
];

export type MembershipStatus = 'Draft' | 'Published' | 'Paused' | 'Under Review';

export type MembershipItem = {
  id: string;
  name: string;
  category: string;
  image: string;
  status: MembershipStatus;
  members: number;
  paying: number;
  trial: number;
  mrr: number;
  earned: number;
  updated: string;
};

export const memberships: MembershipItem[] = [
  { id: 'mem-1', name: 'Inner Circle Mastermind', category: 'Business & Entrepreneurship', image: 'https://picsum.photos/seed/innercircle/200/200', status: 'Published', members: 1125, paying: 842, trial: 128, mrr: 4210.4, earned: 26540.8, updated: 'May 10, 2026' },
  { id: 'mem-2', name: 'Fitness Family Community', category: 'Health & Fitness', image: 'https://picsum.photos/seed/fitnessfamily/200/200', status: 'Published', members: 986, paying: 612, trial: 96, mrr: 2340.2, earned: 12860.4, updated: 'Apr 22, 2026' },
  { id: 'mem-3', name: 'Creator Academy', category: 'Education', image: 'https://picsum.photos/seed/creatoracademy/200/200', status: 'Paused', members: 524, paying: 276, trial: 40, mrr: 980.0, earned: 4860.2, updated: 'Mar 15, 2026' },
];

export const membershipActivity = [
  { id: 'ma-1', name: 'Sarah Johnson', action: 'joined Premium tier', community: 'Inner Circle Mastermind', status: 'New Member', date: 'Today, 10:24 AM' },
  { id: 'ma-2', name: 'Michael Brown', action: 'started a free trial', community: 'Fitness Family Community', status: 'Trial Started', date: 'Today, 09:18 AM' },
  { id: 'ma-3', name: 'Emma Davis', action: 'upgraded to VIP tier', community: 'Inner Circle Mastermind', status: 'Upgraded', date: 'Yesterday, 08:45 PM', amount: 49.99 },
  { id: 'ma-4', name: 'James Wilson', action: 'cancelled membership', community: 'Creator Academy', status: 'Cancelled', date: 'Yesterday, 06:12 PM' },
];

export const referralSummary = {
  totalReferrals: 2845,
  totalEarnings: 8640.8,
  conversionRate: 30.4,
  referralLink: 'https://teamcal.app/ref/feydinma',
  referralCode: 'FEYDINMA20',
};

export type ReferralStatus = 'Invited' | 'Joined' | 'Free Trial' | 'Subscribed' | 'Inactive';

export type ReferralEntry = {
  id: string;
  name: string;
  dateInvited: string;
  dateJoined?: string;
  status: ReferralStatus;
};

export const referralList: ReferralEntry[] = [
  { id: 'ref-1', name: 'Sarah J.', dateInvited: 'May 20, 2026', dateJoined: 'May 21, 2026', status: 'Subscribed' },
  { id: 'ref-2', name: 'Michael B.', dateInvited: 'May 18, 2026', dateJoined: 'May 18, 2026', status: 'Free Trial' },
  { id: 'ref-3', name: 'Emma D.', dateInvited: 'May 12, 2026', dateJoined: 'May 12, 2026', status: 'Joined' },
  { id: 'ref-4', name: 'James W.', dateInvited: 'May 5, 2026', status: 'Invited' },
];

export const referralProgramDetails = [
  { key: 'commission', icon: 'pricetag-outline', title: 'Earn 20%', description: 'Earn 20% commission on every sale or subscription made by your referrals.' },
  { key: 'cookie', icon: 'time-outline', title: '30-Day Cookie', description: "You'll earn commission for purchases made within 30 days of referral." },
  { key: 'limits', icon: 'infinite-outline', title: 'No Limits', description: 'Refer unlimited people and earn with no limits.' },
  { key: 'tracking', icon: 'shield-checkmark-outline', title: 'Instant Tracking', description: 'Real-time tracking and transparent analytics on every referral.' },
];

export const earnQuickActions = [
  { key: 'audience-engine', label: 'Audience Engine', icon: 'people-circle-outline' },
  { key: 'create-blog', label: 'Create Blog', icon: 'create-outline' },
  { key: 'upload-pdf', label: 'Upload PDF', icon: 'document-text-outline' },
  { key: 'upload-video', label: 'Upload Video', icon: 'videocam-outline' },
  { key: 'create-store', label: 'Create Store', icon: 'storefront-outline' },
  { key: 'create-membership', label: 'Create Membership', icon: 'ribbon-outline' },
] as const;

export const contentFormatIcons = {
  blogs: [
    { key: 'upload', label: 'Upload PDF', icon: 'cloud-upload-outline' },
  ],
};

export const audienceEngineConnectedAccounts = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', accounts: 3, color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', accounts: 2, color: '#1877F2' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', accounts: 2, color: '#0A66C2' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', accounts: 1, color: '#111111' },
];

export const audienceEngineTemplates = [
  { key: 'educational', label: 'Educational', posts: 50, icon: 'school-outline' },
  { key: 'product-launch', label: 'Product Launch', posts: 40, icon: 'rocket-outline' },
  { key: 'drive-traffic', label: 'Drive Traffic', posts: 30, icon: 'trending-up-outline' },
  { key: 'engagement', label: 'Engagement Boost', posts: 50, icon: 'heart-outline' },
  { key: 'community', label: 'Community Growth', posts: 30, icon: 'people-outline' },
];

export const audienceEngineCampaigns = [
  { id: 'camp-1', title: 'Fasting Guide Promotion', contentType: 'Blog Post', posts: 50, status: 'Published', date: 'May 20, 2026' },
  { id: 'camp-2', title: 'New PDF Launch Campaign', contentType: 'PDF', posts: 40, status: 'Scheduled', date: 'May 22, 2026' },
  { id: 'camp-3', title: 'Healthy Habits Series', contentType: 'Video Series', posts: 30, status: 'Draft', date: 'May 16, 2026' },
];

export const audienceEnginePerformance = {
  labels: ['May 20', 'May 27', 'Jun 3', 'Jun 10', 'Jun 17'],
  revenue: [1200, 1860, 1500, 1860, 2840],
  postsPublished: 128,
  impressions: 245600,
  engagement: 18400,
  linkClicks: 6842,
  revenueGenerated: 2840.6,
};

export const contentSourceOptions = [
  { key: 'blog-post', label: 'Blog Post', icon: 'document-text-outline' },
  { key: 'full-blog', label: 'Full Blog', icon: 'newspaper-outline' },
  { key: 'pdf', label: 'PDF / eBook', icon: 'book-outline' },
  { key: 'video', label: 'Video', icon: 'videocam-outline' },
  { key: 'video-series', label: 'Video Series', icon: 'film-outline' },
  { key: 'store-product', label: 'Store / Product', icon: 'storefront-outline' },
  { key: 'membership', label: 'Membership', icon: 'people-outline' },
  { key: 'custom-link', label: 'Custom Link', icon: 'link-outline' },
];

export const audienceEngineTones = [
  { key: 'educational', label: 'Educational', icon: 'school-outline' },
  { key: 'conversational', label: 'Conversational', icon: 'chatbubble-outline' },
  { key: 'professional', label: 'Professional', icon: 'briefcase-outline' },
  { key: 'inspirational', label: 'Inspirational', icon: 'star-outline' },
  { key: 'bold', label: 'Bold', icon: 'flash-outline' },
];

export const audienceEngineObjectives = [
  { key: 'views', label: 'Generate Views', icon: 'eye-outline' },
  { key: 'sales', label: 'Generate Sales', icon: 'cart-outline' },
  { key: 'subscribers', label: 'Attract Subscribers', icon: 'people-outline' },
  { key: 'community', label: 'Grow Community', icon: 'people-circle-outline' },
];

export const audienceEngineFormats = [
  { key: 'text', label: 'Text Post', count: 20 },
  { key: 'image', label: 'Single Image', count: 10 },
  { key: 'graphic', label: 'Graphic', count: 10 },
  { key: 'carousel', label: 'Carousel', count: 5 },
  { key: 'video-script', label: 'Short Video Script', count: 5 },
];

export const audienceEngineGeneratedPosts = [
  { id: 'gen-1', caption: 'The truth about fasting that changed everything...', format: 'Instagram Post', status: 'Approved', thumbnail: 'https://picsum.photos/seed/gen1/200/200' },
  { id: 'gen-2', caption: '21-day fast results you can actually see', format: 'Carousel Slide', status: 'Approved', thumbnail: 'https://picsum.photos/seed/gen2/200/200' },
  { id: 'gen-3', caption: 'A simple 21-day fasting plan that works', format: 'Text Post', status: 'Needs Review', thumbnail: 'https://picsum.photos/seed/gen3/200/200' },
  { id: 'gen-4', caption: "Fasting isn't just about skipping meals...", format: 'Stories', status: 'Approved', thumbnail: 'https://picsum.photos/seed/gen4/200/200' },
];

export const blogCreateTypes = [
  { key: 'standard', label: 'Standard Blog', description: 'Perfect for articles, guides, news and ideas.', icon: 'document-text-outline' },
  { key: 'niche', label: 'Niche Blog', description: 'Focused on a specific topic or niche.', icon: 'pricetag-outline' },
  { key: 'personal', label: 'Personal Blog', description: 'Share your personal stories and experiences.', icon: 'person-outline' },
];

export const blogCategories = ['Health & Wellness', 'Personal Development', 'Travel', 'Finance', 'Business', 'Food', 'Fitness', 'Technology'];

export const blogThemeColors = ['#FF6A2B', '#2ED47A', '#3E7BFA', '#8B5CF6', '#182241', '#FF4D5E'];
