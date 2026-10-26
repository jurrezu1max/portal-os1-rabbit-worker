import type { Env } from './types/contracts';
import { health, healthPaths } from './routes/health';
import { icvRoutes } from './routes/icv';
import { gsipRoutes } from './routes/gsip';
import { marketsRoutes } from './routes/markets';
import { complianceRoutes } from './routes/compliance';
import { storeRoutes } from './routes/store';
import { authorize } from './middleware/authorize';
import { failure, HttpError, success } from './utils/http';
import { Metrics } from './telemetry/metrics';
import { logRequest } from './telemetry/logging';
import { traceId } from './telemetry/tracing';
const routes = [...icvRoutes, ...gsipRoutes, ...marketsRoutes, ...complianceRoutes, ...storeRoutes];
export function createGateway() {
  const metrics = new Metrics();
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      const started = performance.now();
      const requestId = traceId();
      let routeLabel = 'unmatched';
      let response: Response;
      try {
        const path = new URL(request.url).pathname;
        const publicHealth = healthPaths.includes(path);
        const matches = routes.filter(route => route.path === path);
        if (!publicHealth && path !== '/metrics' && matches.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Route not found');
        routeLabel = path;
        const allowed = publicHealth || path === '/metrics' ? ['GET'] : matches.map(route => route.method);
        if (!allowed.includes(request.method)) {
          response = failure(new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed'));
          response.headers.set('Allow', allowed.join(', '));
        } else if (publicHealth) {
          response = health();
        } else if (path === '/metrics') {
          await authorize(request, env, 'metrics');
          response = success(metrics.snapshot());
        } else {
          const route = matches.find(candidate => candidate.method === request.method)!;
          const identity = await authorize(request, env, route.permission);
          response = await route.handle(request, identity);
        }
      } catch (error: unknown) { response = failure(error); }
      const durationMs = performance.now() - started;
      metrics.record(response.status, durationMs);
      response.headers.set('X-Request-ID', requestId);
      logRequest({ requestId, route: routeLabel, method: request.method, status: response.status, durationMs });
      return response;
    },
  };
}
export default createGateway();
