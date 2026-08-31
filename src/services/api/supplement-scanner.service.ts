import { apiClient } from './client';

export type ScannedIngredient = {
  name: string;
  amountPerServing: string;
  dailyValue?: string;
  explanation?: string;
};

export type ScannedSupplement = {
  name: string;
  brand: string;
  servingSize: string;
  servingsPerContainer: number;
  estimatedServingsRemaining?: number;
  activeIngredients: ScannedIngredient[];
  otherIngredients: string;
  allergens: string;
  directions: string;
  warnings: string;
  expiryDate?: string;
  suggestedTimeOfDay: 'morning' | 'midday' | 'evening' | 'night';
  suggestedWithFood: boolean;
  scheduleRationale: string;
};

export type SafetyFlag = {
  type: 'interaction' | 'duplicate' | 'allergen' | 'caution';
  severity: 'info' | 'warning' | 'danger';
  message: string;
};

export type ScanHistoryItem = {
  id: string;
  scannedAt: string;
  result: ScannedSupplement;
};

export const supplementScannerService = {
  async analyzeImages(imageUris: { frontLabel?: string; factsPanel?: string; barcode?: string; expiryArea?: string }): Promise<ScannedSupplement> {
    const formData = new FormData();
    const entries = Object.entries(imageUris) as [string, string][];
    for (const [key, uri] of entries) {
      if (uri) {
        formData.append(key, { uri, name: `${key}.jpg`, type: 'image/jpeg' } as any);
      }
    }
    const res = await apiClient.post<{ data: ScannedSupplement }>('/supplements/scan/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45_000,
    });
    return res.data.data;
  },

  async checkSafety(scanned: ScannedSupplement, existingSupplementIds: string[], medications: string[]): Promise<SafetyFlag[]> {
    const res = await apiClient.post<{ data: SafetyFlag[] }>('/supplements/scan/safety', {
      scanned,
      existingSupplementIds,
      medications,
    });
    return res.data.data;
  },

  async getHistory(): Promise<ScanHistoryItem[]> {
    const res = await apiClient.get<{ data: ScanHistoryItem[] }>('/supplements/scan/history');
    return res.data.data;
  },

  async saveToHistory(result: ScannedSupplement): Promise<void> {
    await apiClient.post('/supplements/scan/history', { result });
  },
};
