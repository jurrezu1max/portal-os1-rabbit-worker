import { complianceService } from '../services/compliance.service';
import type { Route } from './router';
import { success } from '../utils/http';
import { body, fields, areas } from '../utils/validation';
export const complianceRoutes: Route[] = [
  { method: 'GET', path: '/api/compliance/status', permission: 'read', handle: async () => { return success(complianceService.status()); } },
  { method: 'GET', path: '/api/compliance/licenses', permission: 'read', handle: async () => { return success(complianceService.licenses()); } },
  { method: 'POST', path: '/api/compliance/audit', permission: 'audit', handle: async (request) => { const input = await body(request); fields(input, ['areas']); return success(complianceService.audit({ areas: areas(input.areas) })); } },
];
