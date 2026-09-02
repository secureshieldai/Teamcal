export type DateRangeKey = '7d'|'30d'|'90d'|'6m'|'1y'|'lifetime'|'custom';
export const dateRangeOptions:{key:DateRangeKey;label:string}[]=[
  {key:'7d',label:'Last 7 Days'},{key:'30d',label:'Last 30 Days'},{key:'90d',label:'Last 90 Days'},
  {key:'6m',label:'Last 6 Months'},{key:'1y',label:'Last 1 Year'},{key:'lifetime',label:'Lifetime'},
];
export type EarningSource={key:string;label:string;value:number;color:string};
export const earningsBySource:EarningSource[]=[
  {key:'blogs',label:'Blogs',value:0,color:'#3E7BFA'},{key:'pdfs',label:'PDFs',value:0,color:'#FF6A2B'},
  {key:'videos',label:'Videos',value:0,color:'#2ED47A'},{key:'stores',label:'Stores',value:0,color:'#FFC542'},
  {key:'memberships',label:'Memberships',value:0,color:'#8B5CF6'},{key:'rewards',label:'Creator Rewards',value:0,color:'#14B8A6'},
  {key:'contests',label:'Contests / Challenges',value:0,color:'#FF4D5E'},{key:'other',label:'Other',value:0,color:'#A6A8B3'},
];
export const withdrawSettings={minimumWithdrawal:10,feeFlat:1};
export const referralProgramDetails=[
    {key:'commission',icon:'pricetag-outline',title:'Earn 10%',description:'Earn 10% commission on eligible subscription payments from customers you successfully refer.'},
    {key:'duration',icon:'time-outline',title:'5 Years of Earnings',description:'A qualified referral can generate eligible commissions for up to 5 years.'},
    {key:'limits',icon:'infinite-outline',title:'No Limits',description:'Invite as many people as you like.'},
    {key:'tracking',icon:'shield-checkmark-outline',title:'Instant Tracking',description:'See qualified referrals and recorded commissions in your account.'},
  ];
export const earnQuickActions=[
  {key:'audience-engine',label:'Audience Engine',icon:'people-circle-outline'},{key:'create-blog',label:'Create Blog',icon:'create-outline'},
  {key:'upload-pdf',label:'Upload PDF',icon:'document-text-outline'},{key:'upload-video',label:'Upload Video',icon:'videocam-outline'},
  {key:'create-store',label:'Create Store',icon:'storefront-outline'},{key:'create-membership',label:'Create Membership',icon:'ribbon-outline'},
  {key:'bots',label:'Bots',icon:'hardware-chip-outline'},
] as const;
export const audienceEngineTemplates=[
  {key:'content-repurposing',label:'Content Repurposing Pack',posts:30,icon:'shuffle-outline',description:'Turn one piece of content into multiple text posts, graphics, carousels, and short-video scripts.'},
  {key:'product-launch',label:'Product Launch Campaign',posts:40,icon:'rocket-outline',description:'Create announcement, feature, benefits, use cases, social proof, urgency and sales posts.'},
  {key:'membership-growth',label:'Membership Growth Campaign',posts:35,icon:'people-outline',description:'Promote community through benefit posts, highlights, member outcomes, FAQs, testimonials.'},
  {key:'blog-traffic',label:'Blog Traffic Campaign',posts:30,icon:'trending-up-outline',description:'Create hooks, lessons, excerpts, curiosity, quote graphics, carousels, and read-more CTAs.'},
  {key:'pdf-ebook',label:'PDF or eBook Promotion',posts:25,icon:'book-outline',description:'Educational previews, takeaways, quote cards, carousels, problem-solution, download CTAs.'},
  {key:'video-promotion',label:'Video Promotion Pack',posts:28,icon:'videocam-outline',description:'Teasers, key-moment posts, clip suggestions, quote graphics, captions, watch-now CTAs.'},
  {key:'30day-calendar',label:'30-Day Content Calendar',posts:30,icon:'calendar-outline',description:'Balanced mix of educational, conversational, promotional, engagement, authority content.'},
  {key:'lead-generation',label:'Lead Generation Campaign',posts:32,icon:'megaphone-outline',description:'Problem-awareness, helpful tips, lead-magnet promos, FAQs, trust-building, action CTAs.'},
  {key:'sales-conversion',label:'Sales and Conversion Campaign',posts:35,icon:'cart-outline',description:'Benefit-led, use cases, comparisons, objection handling, customer results, urgency, purchase CTAs.'},
];
export const audienceEngineTemplatesByKey=Object.fromEntries(audienceEngineTemplates.map(t=>([t.key,t])));
export const contentSourceOptions=[
  {key:'blog-post',label:'Blog Post',icon:'document-text-outline'},{key:'full-blog',label:'Full Blog',icon:'newspaper-outline'},
  {key:'pdf',label:'PDF / eBook',icon:'book-outline'},{key:'video',label:'Video',icon:'videocam-outline'},
  {key:'video-series',label:'Video Series',icon:'film-outline'},{key:'store-product',label:'Store / Product',icon:'storefront-outline'},
  {key:'membership',label:'Membership',icon:'people-outline'},{key:'custom-link',label:'Custom Link',icon:'link-outline'},
];
export const audienceEngineTones=[
  {key:'educational',label:'Educational',icon:'school-outline'},{key:'conversational',label:'Conversational',icon:'chatbubble-outline'},
  {key:'professional',label:'Professional',icon:'briefcase-outline'},{key:'inspirational',label:'Inspirational',icon:'star-outline'},{key:'bold',label:'Bold',icon:'flash-outline'},
];
export const audienceEngineObjectives=[
  {key:'views',label:'Generate Views',icon:'eye-outline'},{key:'traffic',label:'Drive Traffic',icon:'open-outline'},{key:'sales',label:'Generate Sales',icon:'cart-outline'},
  {key:'subscribers',label:'Attract Subscribers',icon:'people-outline'},{key:'community',label:'Grow Community',icon:'people-circle-outline'},{key:'engagement',label:'Increase Engagement',icon:'heart-outline'},
  {key:'awareness',label:'Build Awareness',icon:'megaphone-outline'},{key:'leads',label:'Generate Leads',icon:'target-outline'},
];
export const audienceEngineFormats=[
  {key:'text',label:'Text Post',count:20},{key:'image',label:'Single Image Post',count:10},{key:'graphic',label:'Designed Graphic',count:10},
  {key:'carousel',label:'Carousel',count:5},{key:'video-script',label:'Short Video Script',count:5},{key:'quote',label:'Quote or Testimonial Card',count:8},
  {key:'poll',label:'Poll or Engagement Post',count:5},
];
export const blogCreateTypes=[
  {key:'standard',label:'Standard Blog',description:'Articles, guides, news and ideas.',icon:'document-text-outline'},
  {key:'niche',label:'Niche Blog',description:'Focused on a specific topic.',icon:'pricetag-outline'},
  {key:'personal',label:'Personal Blog',description:'Share personal stories and experiences.',icon:'person-outline'},
];
export const blogCategories=['Health & Wellness','Personal Development','Travel','Finance','Business','Food','Fitness','Technology'];
export const blogThemeColors=['#FF6A2B','#2ED47A','#3E7BFA','#8B5CF6','#182241','#FF4D5E'];
