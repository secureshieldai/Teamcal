import { apiClient } from './client';
import type { EarnEntry } from '../../types/api';

export interface Referral {
  id: string;
  name: string;
  status: 'invited' | 'joined' | 'converted';
  reward: number;
  created_at: string;
}
export type StripePayout={connected:boolean;provider?:string;stripe_account_id?:string;stripe_details_submitted?:boolean;stripe_charges_enabled?:boolean;stripe_payouts_enabled?:boolean;stripe_account_status?:string;history?:unknown[]};
export type EarnAssetKind='pdf'|'video'|'store'|'membership'|'campaign';
export type EarnAssetStatus='draft'|'uploading'|'processing'|'published'|'paused'|'scheduled'|'under-review'|'monetization-review'|'restricted'|'rejected'|'archived';
export type PdfPricingModel='free'|'one-time'|'pay-what-you-want'|'preview-paid'|'membership'|'bundle'|'subscription'|'promotion'|'launch-discount'|'limited-free'|'coupon';
export type PdfMetadata={
  subtitle?:string;author?:string;authorImage?:string;coAuthors?:string[];summary?:string;category?:string;subcategory?:string;tags?:string[];language?:string;backCover?:string;promoImages?:string[];pages?:number;publicationDate?:string;edition?:string;publisher?:string;copyright?:string;isbn?:string;targetAudience?:string;contentRating?:string;
  fileUrl?:string;fileName?:string;fileSize?:number;previewMode?:string;previewValue?:string;showToc?:boolean;searchPreview?:boolean;watermark?:boolean;restrictScreenshots?:boolean;allowCopy?:boolean;previewLocation?:'app'|'browser';requireApp?:boolean;
  pricingModel?:PdfPricingModel;originalPrice?:number;discountPrice?:number;discountStart?:string;discountEnd?:string;taxMode?:string;
  delivery?:string[];deviceAccess?:'one'|'multiple'|'account';reviews?:{id:string;rating:number;text:string;author:string;createdAt:string;reply?:string}[];
};
export type VideoMonetization='free'|'preview-paid'|'paid-video'|'paid-series'|'creator-rewards'|'episode'|'season'|'subscription'|'membership'|'bundle'|'rental'|'discount'|'coupon';
export type VideoEpisode={id:string;title:string;season?:number;episode?:number;module?:number;lesson?:number;videoAssetId?:string;duration?:number;price?:number;free?:boolean;releaseDate?:string};
export type VideoMetadata={subtitle?:string;summary?:string;category?:string;subcategory?:string;tags?:string[];language?:string;thumbnail?:string;promoImages?:string[];captionsUrl?:string;subtitlesUrl?:string;transcript?:string;transcriptUrl?:string;seriesName?:string;seriesId?:string;season?:number;episode?:number;module?:number;lesson?:number;publicationDate?:string;scheduledRelease?:string;contentRating?:string;ageSuitability?:string;commentsEnabled?:boolean;downloadsEnabled?:boolean;sharingEnabled?:boolean;fileUrl?:string;fileName?:string;fileSize?:number;duration?:number;previewMode?:string;previewSeconds?:number;previewStart?:number;trailerUrl?:string;monetization?:VideoMonetization;permanentAccess?:boolean;multipleDevices?:boolean;episodePrice?:number;seasonPrice?:number;seriesPrice?:number;subscriptionInterval?:string;subscriptionBenefits?:string[];rentalDays?:number;discountPrice?:number;coupon?:string;linkBehavior?:string;episodes?:VideoEpisode[];releaseMode?:string;rewardsRegion?:string;reviews?:{id:string;rating:number;text:string;author:string;createdAt:string;reply?:string}[];comments?:{id:string;text:string;author:string;createdAt:string}[]};
export type MembershipTier={id:string;name:string;description:string;color:string;badge?:string;monthly?:number;quarterly?:number;sixMonth?:number;annual?:number;lifetime?:number;trial?:string;benefits:string[];contentAccess?:string;eventAccess?:string;chat?:boolean;downloads?:boolean;creatorAccess?:boolean;discount?:string;earlyAccess?:boolean};
export type MembershipMember={id:string;name:string;avatar?:string;tier:string;joinDate:string;trialStatus?:string;status:'free'|'trial'|'active'|'past-due'|'paused'|'cancelled'|'expired'|'removed';nextBilling?:string;lastPayment?:number;role:'owner'|'moderator'|'member';activity:'high'|'medium'|'low'};
export type MembershipEvent={id:string;title:string;type:string;date:string;time:string;timeZone:string;duration:number;limit?:number;tiers:string[];reminder:string;replay:boolean;price?:number;recurring?:boolean};
export type MembershipMetadata={groupId?:string;profileImage?:string;banner?:string;category?:string;subcategory?:string;rules?:string;valueProposition?:string;audience?:string;memberReceives?:string;welcomeMessage?:string;faqs?:{question:string;answer:string}[];language?:string;privacy?:string;discoverability?:string;memberApproval?:string;postingPermission?:string;commentPermission?:string;dmPermission?:string;moderatorPermission?:string;eventPermission?:string;contentRules?:string;pricingModel?:'free'|'lifetime'|'recurring'|'tiers';currency?:string;lifetimePrice?:number;launchPrice?:number;couponCodes?:string[];lifetimeTerms?:string;monthlyPrice?:number;quarterlyPrice?:number;sixMonthPrice?:number;annualPrice?:number;trial?:string;trialPlans?:string[];paymentRequiredForTrial?:boolean;trialReminder?:boolean;autoRenew?:boolean;repeatTrials?:boolean;tiers?:MembershipTier[];benefits?:string[];members?:MembershipMember[];events?:MembershipEvent[];resources?:{id:string;title:string;type:string;access:string}[];scheduledPosts?:{id:string;title:string;date:string;access:string}[];testimonials?:string[];linkBehavior?:string};
export type EarnAsset={id:string;kind:EarnAssetKind;subtype:string;title:string;description:string;image?:string|null;status:EarnAssetStatus;price:number;currency:string;metrics:Record<string,number>;metadata:Record<string,unknown>;created_at:string;updated_at:string};
export type EarnSummary={balance:number;lifetimeEarnings:number;periodEarnings:number;range:string;last30Days:number;availableBalance:number;pendingEarnings:number;totalWithdrawn:number;sourceTotals:Record<string,number>;counts:{assets:number;blogs:number;products:number;referrals:number}};

export const earnService = {
  async getSummary(range:'7d'|'30d'|'90d'|'6m'|'1y'|'lifetime'='30d'){const {data}=await apiClient.get<{success:boolean;summary:EarnSummary;entries:EarnEntry[];payout:StripePayout;assets:EarnAsset[]}>('/earn/summary',{params:{range}});return data;},
  async getAssets(kind?:EarnAssetKind){const {data}=await apiClient.get<{success:boolean;assets:EarnAsset[]}>('/earn/assets',{params:{kind}});return data.assets;},
  async getAsset(id:string){
    try {
      const {data}=await apiClient.get<{success:boolean;asset:EarnAsset}>(`/earn/assets/${id}`);
      return data.asset;
    } catch {
      const {data}=await apiClient.get<{success:boolean;asset:EarnAsset}>(`/earn/assets/${id}/public`);
      apiClient.post(`/earn/assets/${id}/view`).catch(()=>undefined);
      return data.asset;
    }
  },
  async getPublicAsset(id:string){const {data}=await apiClient.get<{success:boolean;asset:EarnAsset & {owner?:boolean}}>(`/earn/assets/${id}/public`);return data.asset;},
  async recordAssetView(id:string){const {data}=await apiClient.post<{success:boolean;metrics:Record<string,number>}>(`/earn/assets/${id}/view`);return data.metrics;},
  async getPublicMembership(id:string){const {data}=await apiClient.get<{success:boolean;asset:EarnAsset}>(`/earn/memberships/${id}/public`);return data.asset;},
  async createAsset(value:{kind:EarnAssetKind;subtype?:string;title:string;description?:string;image?:string;status?:EarnAssetStatus;price?:number;currency?:string;metadata?:Record<string,unknown>}){const {data}=await apiClient.post<{success:boolean;asset:EarnAsset}>('/earn/assets',value);return data.asset;},
  async updateAsset(id:string,value:Partial<Omit<EarnAsset,'id'|'kind'|'created_at'|'updated_at'|'metrics'>>){const {data}=await apiClient.patch<{success:boolean;asset:EarnAsset}>(`/earn/assets/${id}`,value);return data.asset;},
  async deleteAsset(id:string){await apiClient.delete(`/earn/assets/${id}`);},
  async uploadPdf(file:{uri:string;name:string;mimeType?:string}){const form=new FormData();form.append('pdf',{uri:file.uri,name:file.name,type:file.mimeType||'application/pdf'} as unknown as Blob);const {data}=await apiClient.post<{success:boolean;fileUrl:string;fileName:string;fileSize:number}>('/earn/pdfs/upload',form,{headers:{'Content-Type':'multipart/form-data'},timeout:120000});return data;},
  async uploadVideoFile(file:{uri:string;name:string;mimeType?:string}){const form=new FormData();form.append('file',{uri:file.uri,name:file.name,type:file.mimeType||'video/mp4'} as unknown as Blob);const {data}=await apiClient.post<{success:boolean;fileUrl:string;fileName:string;fileSize:number;processingStatus:string}>('/earn/videos/upload',form,{headers:{'Content-Type':'multipart/form-data'},timeout:180000});return data;},
  /**
   * GET /api/earn/entries
   * Returns { entries, total, monthly }
   */
  async getEntries() {
    const { data } = await apiClient.get<{
      success: boolean;
      entries: EarnEntry[];
      total: number;
      monthly: number;
    }>('/earn/entries');
    return data;
  },

  /**
   * GET /api/earn/referrals
   * Returns { referrals } — list of invited/joined people
   */
  async getReferrals() {
    const { data } = await apiClient.get<{ success: boolean; referrals: Referral[] }>(
      '/earn/referrals'
    );
    return data.referrals;
  },

  /** GET /api/earn/payout */
  async getPayout() {
    const { data } = await apiClient.get<{ success: boolean; payout: StripePayout }>('/earn/payout');
    return data.payout;
  },
  async connectStripe(country?:string){const {data}=await apiClient.post<{success:boolean;payout:StripePayout;onboardingUrl:string}>('/earn/payout/connect',{country});return data;},
  async payoutStatus(){const {data}=await apiClient.get<{success:boolean;payout:StripePayout|null;requirements:string[];disabledReason?:string}>('/earn/payout/status');return data;},
  async payoutLoginLink(){const {data}=await apiClient.post<{success:boolean;url:string}>('/earn/payout/login-link');return data.url;},
  async withdraw(amount:number,currency='usd'){const {data}=await apiClient.post<{success:boolean;payout:StripePayout}>('/earn/payout/withdraw',{amount,currency,idempotencyKey:`${Date.now()}`});return data.payout;},
  async inviteReferral(name: string) { const { data } = await apiClient.post<{success:boolean;referral:Referral}>('/earn/referrals',{name});return data.referral; },
  async dailyCheckin(){const {data}=await apiClient.post('/earn/checkin');return data;},
  async getRedemptions(){const {data}=await apiClient.get<{success:boolean;redemptions:unknown[];catalog:{id:string;label:string;cost:number}[]}>('/earn/redemptions');return data;},
  async redeem(rewardId:string){const {data}=await apiClient.post('/earn/redeem',{rewardId});return data;},
};
