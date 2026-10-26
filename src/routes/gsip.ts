import { gsipService } from '../services/gsip.service';
import type { Route } from './router';
import { success } from '../utils/http';
import { body, fields, text, amount, currency } from '../utils/validation';
export const gsipRoutes: Route[] = [
  { method: 'GET', path: '/api/gsip/assets', permission: 'read', handle: async () => { return success(gsipService.assets()); } },
  { method: 'POST', path: '/api/gsip/assets', permission: 'write', handle: async (request) => { const input = await body(request); fields(input, ['title', 'category']); return success(gsipService.createAsset({ title: text(input.title), category: text(input.category) })); } },
  { method: 'GET', path: '/api/gsip/pipeline', permission: 'read', handle: async () => { return success(gsipService.pipeline()); } },
  { method: 'POST', path: '/api/gsip/revenue', permission: 'write', handle: async (request) => { const input = await body(request); fields(input, ['assetId', 'amount', 'currency']); return success(gsipService.revenue({ assetId: text(input.assetId), amount: amount(input.amount), currency: currency(input.currency) })); } },
];
