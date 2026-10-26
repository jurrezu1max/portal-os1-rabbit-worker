import { marketService } from '../services/market.service';
import type { Route } from './router';
import { success } from '../utils/http';
export const marketsRoutes: Route[] = [
  { method: 'GET', path: '/api/markets/opportunities', permission: 'read', handle: async () => { return success(marketService.opportunities()); } },
  { method: 'GET', path: '/api/markets/trends', permission: 'read', handle: async () => { return success(marketService.trends()); } },
  { method: 'GET', path: '/api/markets/forecast', permission: 'read', handle: async () => { return success(marketService.forecast()); } },
];
