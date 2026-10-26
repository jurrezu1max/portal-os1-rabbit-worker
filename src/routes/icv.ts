import { icvService } from '../services/icv.service';
import type { Route } from './router';
import { success } from '../utils/http';
import { body, fields, text } from '../utils/validation';
export const icvRoutes: Route[] = [
  { method: 'GET', path: '/api/icv/context', permission: 'read', handle: async () => { return success(icvService.context()); } },
  { method: 'GET', path: '/api/icv/identity', permission: 'read', handle: async (_request, identity) => { return success(icvService.identity(identity)); } },
  { method: 'POST', path: '/api/icv/coherence', permission: 'write', handle: async (request) => { const input = await body(request); fields(input, ['statement']); return success(icvService.coherence({ statement: text(input.statement) })); } },
  { method: 'POST', path: '/api/icv/strategy', permission: 'write', handle: async (request) => { const input = await body(request); fields(input, ['objective']); return success(icvService.strategy({ objective: text(input.objective) })); } },
];
