import { storeService } from '../services/store.service';
import type { Route } from './router';
import { success } from '../utils/http';
import { body, fields, text } from '../utils/validation';
export const storeRoutes: Route[] = [
  { method: 'GET', path: '/api/store/catalog', permission: 'read', handle: async () => { return success(storeService.catalog()); } },
  { method: 'POST', path: '/api/store/acquire', permission: 'write', handle: async (request, identity) => { const input = await body(request); fields(input, ['itemId']); return success(storeService.acquire({ itemId: text(input.itemId) }, identity)); } },
  { method: 'GET', path: '/api/store/licenses', permission: 'read', handle: async () => { return success(storeService.licenses()); } },
];
