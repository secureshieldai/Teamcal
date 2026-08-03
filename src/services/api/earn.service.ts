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
export type EarnAssetStatus='draft'|'processing'|'published'|'paused'|'scheduled'|'under-review';
export type EarnAsset={id:string;kind:EarnAssetKind;subtype:string;title:string;description:string;image?:string|null;status:EarnAssetStatus;price:number;currency:string;metrics:Record<string,number>;metadata:Record<string,unknown>;created_at:string;updated_at:string};
export type EarnSummary={balance:number;lifetimeEarnings:number;last30Days:number;availableBalance:number;pendingEarnings:number;totalWithdrawn:number;sourceTotals:Record<string,number>;counts:{assets:number;blogs:number;products:number;referrals:number}};

export const earnService = {
  async getSummary(){const {data}=await apiClient.get<{success:boolean;summary:EarnSummary;entries:EarnEntry[];payout:StripePayout;assets:EarnAsset[]}>('/earn/summary');return data;},
  async getAssets(kind?:EarnAssetKind){const {data}=await apiClient.get<{success:boolean;assets:EarnAsset[]}>('/earn/assets',{params:{kind}});return data.assets;},
  async createAsset(value:{kind:EarnAssetKind;subtype?:string;title:string;description?:string;image?:string;status?:EarnAssetStatus;price?:number;currency?:string;metadata?:Record<string,unknown>}){const {data}=await apiClient.post<{success:boolean;asset:EarnAsset}>('/earn/assets',value);return data.asset;},
  async updateAsset(id:string,value:Partial<Omit<EarnAsset,'id'|'kind'|'created_at'|'updated_at'|'metrics'>>){const {data}=await apiClient.patch<{success:boolean;asset:EarnAsset}>(`/earn/assets/${id}`,value);return data.asset;},
  async deleteAsset(id:string){await apiClient.delete(`/earn/assets/${id}`);},
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
