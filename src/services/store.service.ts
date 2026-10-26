import type { AcquireInput, CatalogItem, Identity, License } from '../types/contracts';
import { HttpError } from '../utils/http';
export const storeService = {
  catalog: (): { items: CatalogItem[]; mode: 'mock' } => ({ items: [{ id: 'item_001', title: 'Example asset', licenseType: 'evaluation' }], mode: 'mock' }),
  acquire: (input: AcquireInput, identity: Identity): { license: License; persisted: false; mode: 'mock' } => {
    if (input.itemId !== 'item_001') throw new HttpError(404, 'ITEM_NOT_FOUND', 'Catalog item not found');
    return { license: { id: `license_${crypto.randomUUID()}`, itemId: input.itemId, ownerId: identity.id, type: 'evaluation', status: 'mock' }, persisted: false, mode: 'mock' };
  },
  licenses: (): { licenses: License[]; mode: 'mock' } => ({ licenses: [], mode: 'mock' }),
};
