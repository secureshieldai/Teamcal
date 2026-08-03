import { useCallback, useEffect, useState } from 'react';
import { earnService, type EarnAsset, type EarnAssetKind } from '../services/api/earn.service';

export function useEarnAssets(kind: EarnAssetKind) {
  const [assets, setAssets] = useState<EarnAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setError(''); setAssets(await earnService.getAssets(kind)); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (value: Parameters<typeof earnService.createAsset>[0]) => {
    const asset = await earnService.createAsset(value);
    setAssets((current) => [asset, ...current]);
    return asset;
  }, []);
  const update = useCallback(async (id: string, value: Parameters<typeof earnService.updateAsset>[1]) => {
    const asset = await earnService.updateAsset(id, value);
    setAssets((current) => current.map((item) => item.id === id ? asset : item));
    return asset;
  }, []);
  const remove = useCallback(async (id: string) => {
    await earnService.deleteAsset(id);
    setAssets((current) => current.filter((item) => item.id !== id));
  }, []);
  return { assets, loading, error, refresh, create, update, remove };
}
