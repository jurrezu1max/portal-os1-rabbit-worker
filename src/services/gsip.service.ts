import type { Asset, AssetInput, RevenueInput } from '../types/contracts';
export const gsipService = {
  assets: (): { assets: Asset[]; mode: 'mock' } => ({ assets: [{ id: 'asset_001', title: 'Example IP asset', category: 'software', status: 'creation' }], mode: 'mock' }),
  createAsset: (input: AssetInput): { asset: Asset; persisted: false; mode: 'mock' } => ({ asset: { id: `asset_${crypto.randomUUID()}`, ...input, status: 'creation' }, persisted: false, mode: 'mock' }),
  pipeline: () => ({ stages: [{ status: 'creation', count: 1 }], mode: 'mock' as const }),
  revenue: (input: RevenueInput) => ({ ...input, recorded: false, mode: 'mock' as const }),
};
