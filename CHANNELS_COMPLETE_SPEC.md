# TeamCal Channels - Complete Implementation Specification

## Overview
This document outlines the complete Channels system architecture. Building this properly requires **8-12 weeks** and approximately **60+ files** across frontend, backend, and infrastructure.

---

## 📁 Required Files & Components

### **Backend (Node.js/Express) — 25+ files**

#### Routes
- `backend/src/routes/channel.routes.js` — CRUD channels, follow, settings
- `backend/src/routes/channel-post.routes.js` — Create, edit, delete posts
- `backend/src/routes/channel-feed.routes.js` — Get channel feed, discovery
- `backend/src/routes/channel-analytics.routes.js` — Creator insights
- `backend/src/routes/channel-moderation.routes.js` — Reports, bans
- `backend/src/routes/channel-monetization.routes.js` — Apply, earnings, withdraw
- `backend/src/routes/ad-campaign.routes.js` — Create ads, targeting
- `backend/src/routes/admin-channels.routes.js` — Admin management

#### Controllers
- `backend/src/controllers/channel.controller.js`
- `backend/src/controllers/channel-post.controller.js`
- `backend/src/controllers/channel-analytics.controller.js`
- `backend/src/controllers/channel-moderation.controller.js`
- `backend/src/controllers/channel-monetization.controller.js`
- `backend/src/controllers/ad-campaign.controller.js`
- `backend/src/controllers/admin-channels.controller.js`

#### Services
- `backend/src/services/channel.service.js` — Business logic
- `backend/src/services/channel-feed.service.js` — Feed algorithm
- `backend/src/services/channel-analytics.service.js` — Aggregation
- `backend/src/services/ad-placement.service.js` — Ad injection logic
- `backend/src/services/revenue-share.service.js` — Calculate payouts

#### Middleware
- `backend/src/middleware/channel-owner.middleware.js` — Check ownership
- `backend/src/middleware/channel-admin.middleware.js` — Check admin role
- `backend/src/middleware/channel-permission.middleware.js` — Granular permissions

#### Jobs/Workers
- `backend/src/jobs/daily-analytics-aggregator.job.js` — Daily rollup
- `backend/src/jobs/revenue-calculator.job.js` — Calculate creator earnings
- `backend/src/jobs/ad-delivery.job.js` — Schedule ad placements

---

### **Frontend (React Native) — 35+ files**

#### Screens
- `src/screens/channels/ChannelsHomeScreen.tsx` — Main channels list
- `src/screens/channels/ChannelFeedScreen.tsx` — Single channel feed
- `src/screens/channels/CreateChannelScreen.tsx` — Create channel flow
- `src/screens/channels/EditChannelScreen.tsx` — Edit channel settings
- `src/screens/channels/ChannelSettingsScreen.tsx` — Full settings panel
- `src/screens/channels/ChannelMembersScreen.tsx` — Follower list
- `src/screens/channels/ChannelAdminsScreen.tsx` — Manage admins
- `src/screens/channels/ChannelAnalyticsScreen.tsx` — Creator insights
- `src/screens/channels/ChannelEarningsScreen.tsx` — Earnings dashboard
- `src/screens/channels/ChannelDiscoveryScreen.tsx` — Discover channels
- `src/screens/channels/ChannelSearchScreen.tsx` — Search channels
- `src/screens/channels/ChannelCategoryScreen.tsx` — Browse by category
- `src/screens/channels/PostComposerScreen.tsx` — Create post
- `src/screens/channels/PostDetailScreen.tsx` — Single post + comments
- `src/screens/channels/ChannelReportsScreen.tsx` — Moderation
- `src/screens/admin/AdminChannelsScreen.tsx` — Admin dashboard
- `src/screens/admin/AdminMonetizationScreen.tsx` — Approve monetization
- `src/screens/admin/AdminAdsScreen.tsx` — Manage ads

#### Components
- `src/components/channels/ChannelCard.tsx` — Channel list item
- `src/components/channels/ChannelHeader.tsx` — Channel profile header
- `src/components/channels/ChannelPostCard.tsx` — Post in feed
- `src/components/channels/ChannelPostReactions.tsx` — Reaction bar
- `src/components/channels/ChannelPostComment.tsx` — Comment item
- `src/components/channels/ChannelAdBanner.tsx` — Ad unit component
- `src/components/channels/ChannelRoleSelector.tsx` — Admin role picker
- `src/components/channels/ChannelPermissionToggle.tsx` — Permission switches
- `src/components/channels/ChannelAnalyticsChart.tsx` — Analytics graph
- `src/components/channels/ChannelEarningsCard.tsx` — Earnings summary

#### Services
- `src/services/api/channels.service.ts` — API calls
- `src/services/api/channel-posts.service.ts`
- `src/services/api/channel-analytics.service.ts`
- `src/services/api/channel-monetization.service.ts`
- `src/services/api/ad-campaigns.service.ts`

#### Hooks
- `src/hooks/useChannels.ts` — Fetch user's channels
- `src/hooks/useChannelFeed.ts` — Infinite scroll feed
- `src/hooks/useChannelAnalytics.ts` — Analytics data
- `src/hooks/useChannelEarnings.ts` — Earnings data

#### Types
- `src/types/channels.ts` — TypeScript definitions

---

## 🗂️ Database Schema Summary

### Core Tables
```
channels (id, owner_id, name, username, description, avatar, cover_image, category, rules, is_public, allow_comments, allow_reactions, allow_sharing, allow_downloads, follower_count, post_count, is_monetized, revenue_share_percent)

channel_members (id, channel_id, user_id, role, can_post, can_edit, can_delete, can_pin, can_moderate, can_manage, followed_at)

channel_posts (id, channel_id, author_id, content_type, text_content, media_url, link_url, poll_data, poll_ends_at, view_count, reaction_count, comment_count, share_count, is_pinned, is_announcement)

channel_post_reactions (id, post_id, user_id, emoji)

channel_post_comments (id, post_id, user_id, parent_id, content)

channel_analytics (id, channel_id, date, new_followers, unfollows, post_views, reactions, comments, shares, ad_impressions, ad_clicks, ad_revenue_usd, creator_revenue_usd)

channel_reports (id, channel_id, post_id, reporter_id, reason, details, status, reviewed_by, reviewed_at)
```

### Monetization Tables
```
ad_campaigns (id, advertiser_id, name, budget_usd, spent_usd, pricing_model, target_categories, target_age_min, target_age_max, status, starts_at, ends_at)

ad_creatives (id, campaign_id, type, media_url, title, description, cta_text, cta_url)

ad_impressions (id, campaign_id, channel_id, user_id, clicked, converted, revenue_usd)

channel_monetization_applications (id, channel_id, applied_at, status, reviewed_by, reviewed_at, rejection_reason)

channel_earnings (id, channel_id, period_start, period_end, total_impressions, total_ad_revenue_usd, creator_share_usd, platform_share_usd, status)

channel_withdrawals (id, channel_id, amount_usd, status, requested_at, processed_at, payment_method, payment_details)
```

---

## 🚀 API Endpoints (60+ routes)

### **Channels**
- `POST /api/channels` — Create channel
- `GET /api/channels/:id` — Get channel details
- `PUT /api/channels/:id` — Update channel
- `DELETE /api/channels/:id` — Delete channel
- `POST /api/channels/:id/follow` — Follow channel
- `DELETE /api/channels/:id/follow` — Unfollow channel
- `GET /api/channels/:id/followers` — Get followers
- `GET /api/channels/my` — Get user's channels
- `GET /api/channels/following` — Get followed channels
- `GET /api/channels/discover` — Discover channels
- `GET /api/channels/trending` — Trending channels
- `GET /api/channels/search` — Search channels
- `GET /api/channels/category/:category` — Browse by category

### **Channel Posts**
- `POST /api/channels/:id/posts` — Create post
- `GET /api/channels/:id/posts` — Get channel feed
- `GET /api/channels/posts/:postId` — Get single post
- `PUT /api/channels/posts/:postId` — Edit post
- `DELETE /api/channels/posts/:postId` — Delete post
- `POST /api/channels/posts/:postId/pin` — Pin post
- `POST /api/channels/posts/:postId/react` — Add reaction
- `DELETE /api/channels/posts/:postId/react` — Remove reaction
- `GET /api/channels/posts/:postId/comments` — Get comments
- `POST /api/channels/posts/:postId/comments` — Add comment
- `DELETE /api/channels/posts/comments/:commentId` — Delete comment

### **Channel Administration**
- `POST /api/channels/:id/admins` — Add admin/moderator
- `DELETE /api/channels/:id/admins/:userId` — Remove admin
- `PUT /api/channels/:id/admins/:userId/permissions` — Update permissions
- `POST /api/channels/:id/ban/:userId` — Ban user
- `DELETE /api/channels/:id/ban/:userId` — Unban user
- `PUT /api/channels/:id/settings` — Update settings
- `POST /api/channels/:id/transfer` — Transfer ownership

### **Analytics & Insights**
- `GET /api/channels/:id/analytics` — Get analytics (30 days)
- `GET /api/channels/:id/analytics/posts` — Top posts
- `GET /api/channels/:id/analytics/audience` — Audience insights

### **Monetization**
- `POST /api/channels/:id/monetization/apply` — Apply for monetization
- `GET /api/channels/:id/earnings` — Get earnings dashboard
- `POST /api/channels/:id/earnings/withdraw` — Request withdrawal
- `GET /api/channels/:id/earnings/history` — Withdrawal history

### **Advertising**
- `POST /api/ads/campaigns` — Create ad campaign
- `GET /api/ads/campaigns` — Get campaigns
- `PUT /api/ads/campaigns/:id` — Update campaign
- `DELETE /api/ads/campaigns/:id` — Delete campaign
- `POST /api/ads/campaigns/:id/start` — Start campaign
- `POST /api/ads/campaigns/:id/pause` — Pause campaign
- `GET /api/ads/campaigns/:id/analytics` — Campaign analytics

### **Admin**
- `GET /api/admin/channels` — List all channels
- `PUT /api/admin/channels/:id/suspend` — Suspend channel
- `PUT /api/admin/channels/:id/restore` — Restore channel
- `GET /api/admin/reports` — Get all reports
- `PUT /api/admin/reports/:id/resolve` — Resolve report
- `GET /api/admin/monetization/applications` — Pending applications
- `PUT /api/admin/monetization/:id/approve` — Approve monetization
- `PUT /api/admin/monetization/:id/reject` — Reject monetization
- `PUT /api/admin/monetization/:id/suspend` — Suspend monetization
- `PUT /api/admin/settings/revenue-share` — Update platform revenue %

---

## 🎯 Key Features Breakdown

### **1. Channel Creation & Management**
- Multi-step creation flow
- Username validation (real-time check)
- Category selection from predefined list
- Public/Private visibility
- Granular permission toggles
- Custom rules editor
- Transfer ownership flow with 2FA

### **2. Content Publishing**
- Rich text editor
- Image upload (single/multiple)
- Video upload with transcoding
- Audio recording/upload
- Document upload (PDF, DOC)
- Link preview generation
- Poll creator (multi-option, expiry)
- Announcement badge
- Scheduled posts (future)

### **3. Feed Algorithm**
- Chronological by default
- Pinned posts always on top
- Ad injection every N posts
- Read receipts (view tracking)
- Infinite scroll pagination
- Pull-to-refresh

### **4. Reactions & Comments**
- 7 emoji reactions (👍❤️😂🙏😢😮🔥)
- Real-time reaction count updates
- Nested comment threads (1 level deep)
- @ mentions in comments
- Comment moderation (hide, delete)

### **5. Discovery & Search**
- Trending algorithm (engagement score)
- Recommended based on user interests
- Popular (follower count)
- New channels
- Category browse
- Full-text search
- Filters (category, followers, public/private)

### **6. Roles & Permissions**
- Owner (full control + transfer)
- Admin (all except transfer/delete channel)
- Moderator (moderate content + users)
- Follower (view + interact based on permissions)
- Granular permission matrix per admin/mod

### **7. Analytics (100+ followers required)**
- 30-day rolling window
- Accounts reached
- Net new followers (new - unfollows)
- Total followers graph
- Post views
- Engagement rate (reactions + comments) / views
- Top performing posts
- Audience demographics (age, gender)

### **8. Advertising System**
- Self-serve campaign creation
- Budget & schedule
- CPM / CPC / CPA pricing
- Audience targeting:
  - Age range
  - Gender
  - Categories
  - Geographic location (future)
- Native ad units (in-feed cards)
- Banner ads (top/bottom)
- Sponsored posts
- Video ads (pre-roll for video posts)
- Frequency capping
- A/B creative testing (future)

### **9. Revenue Sharing**
- Configurable platform split (default 60/40)
- Real-time earnings tracking
- Minimum payout threshold ($50)
- Payment methods (Stripe Connect, PayPal)
- Tax form collection (W-9/W-8)
- Monthly payout cycle
- Earnings dashboard with graphs

### **10. Monetization Eligibility**
- Application flow
- Admin-configurable requirements:
  - Min followers (default: 1000)
  - Min post views (default: 10,000/30d)
  - Min channel age (default: 60 days)
  - Min engagement rate (default: 2%)
- KYC verification (Stripe Identity)
- Policy compliance check
- Manual admin approval
- Email notification on approval/rejection

### **11. Moderation & Safety**
- Report channel
- Report post
- Report comment
- Predefined reason categories
- User blocking
- Content takedown
- Suspend/ban users from channel
- Admin review queue
- Automated flag thresholds

### **12. Admin Dashboard**
- Channel management (search, filter, suspend)
- User management
- Content moderation queue
- Monetization application queue
- Revenue analytics (platform total)
- Ad campaign management
- Revenue share % configuration
- Global channel settings
- Category management

---

## 🔧 Technical Implementation Notes

### **Backend Architecture**
- RESTful API with Express.js
- PostgreSQL with Supabase
- Redis for caching (channel metadata, analytics)
- Bull/BullMQ for job queues
- Cron jobs for daily analytics aggregation
- File uploads to S3/Cloudflare R2
- Video transcoding with FFmpeg or cloud service
- Real-time updates via WebSockets (Socket.io) for reactions/comments

### **Frontend Architecture**
- React Native with TypeScript
- React Query for data fetching & caching
- Context API for channel state
- Infinite scroll with FlatList
- Optimistic UI updates
- Image caching with react-native-fast-image
- Video player with expo-av
- Rich text editor (custom or react-native-pell-rich-editor)

### **Performance Optimizations**
- Database indexes on all foreign keys
- Materialized views for trending/popular
- CDN for media assets
- Feed pagination (cursor-based)
- Analytics pre-aggregation (daily rollups)
- Ad impression batching

### **Security**
- Row-level security (Supabase RLS)
- Rate limiting (express-rate-limit)
- Input validation (Joi or Zod)
- XSS protection
- CSRF tokens
- JWT authentication
- Role-based access control (RBAC)

---

## 📅 Implementation Timeline

### **Week 1-2: Foundation**
- Database schema
- Basic CRUD API routes
- Channel creation UI
- Channel list UI
- Follow/unfollow

### **Week 3-4: Content**
- Post composer
- Post feed
- Reactions
- Comments
- Media uploads

### **Week 5-6: Discovery & Roles**
- Discovery UI
- Search
- Admin/mod roles
- Permission system
- Channel settings

### **Week 7-8: Analytics**
- Analytics aggregation jobs
- Creator insights UI
- Basic reporting

### **Week 9-10: Advertising**
- Ad campaign system
- Ad placement logic
- Ad UI components
- Impression tracking

### **Week 11-12: Monetization**
- Revenue calculation
- Earnings dashboard
- Withdrawal system
- Admin approval flow

---

## 💰 Estimated Costs

### **Development**
- Backend engineer: 12 weeks × $100/hr × 40 hrs = $48,000
- Frontend engineer: 12 weeks × $100/hr × 40 hrs = $48,000
- Total: ~$96,000

### **Infrastructure (monthly)**
- Supabase Pro: $25/mo
- Cloudflare R2 (storage): $15/mo
- Redis (Upstash): $10/mo
- Video transcoding (Mux): ~$500/mo (usage-based)
- Total: ~$550/mo

### **Third-Party Services**
- Stripe Connect (payouts): 0.25% of volume
- Payment processing: 2.9% + $0.30 per transaction

---

## 🚨 What I Can Build Right Now

Given the scope, I can build **Phase 1 (Foundation)** which includes:

1. ✅ Complete database schema (done)
2. Backend API for channels CRUD
3. Backend API for posts & feed
4. Frontend Channels tab integration
5. Create channel screen
6. Channel feed screen
7. Post composer
8. Basic follow/unfollow
9. Reactions & comments

**This will take approximately 15-20 files and 3,000-4,000 lines of code.**

Phases 2-4 (discovery, analytics, ads, monetization) would be built incrementally after Phase 1 is tested and working.

---

## ❓ Decision Required

Would you like me to:

**Option A:** Build Phase 1 Foundation now (channels, posts, feed, reactions, comments)
**Option B:** Continue with detailed specs for Phases 2-4 first
**Option C:** Start with just the frontend UI (dummy data) so you can see the design first

Please confirm which direction to proceed.
