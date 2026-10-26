import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createGateway } from '../src/index';
import { hashKey, parseKeys, equalDigest } from '../src/security/keys';
import { authenticate } from '../src/security/auth';
import { isRole, requirePermission } from '../src/security/permissions';
import { Metrics } from '../src/telemetry/metrics';
import { icvService } from '../src/services/icv.service';
import { gsipService } from '../src/services/gsip.service';
import { marketService } from '../src/services/market.service';
import { complianceService } from '../src/services/compliance.service';
import { storeService } from '../src/services/store.service';
import type { Env, Role, Permission } from '../src/types/contracts';
const key = 'test-only-key-with-at-least-32-characters';
let env: Env;
beforeAll(async () => { env = { API_KEYS: JSON.stringify([{ id: 'founder', role: 'Founder', digest: await hashKey(key) }]) }; });
afterEach(() => { vi.restoreAllMocks(); });
function request(path: string, method = 'GET', data?: unknown, apiKey: string | null = key): Request {
  const headers: Record<string, string> = {};
  if (apiKey !== null) headers['X-API-Key'] = apiKey;
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  return new Request(`https://gateway.example${path}`, { method, headers, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
}
const endpoints = [
  { path: '/api/icv/context', method: 'GET', field: 'ecosystem' },
  { path: '/api/icv/identity', method: 'GET', field: 'id' },
  { path: '/api/icv/coherence', method: 'POST', data: { statement: 'A coherent goal' }, field: 'score' },
  { path: '/api/icv/strategy', method: 'POST', data: { objective: 'Build infrastructure' }, field: 'steps' },
  { path: '/api/gsip/assets', method: 'GET', field: 'assets' },
  { path: '/api/gsip/assets', method: 'POST', data: { title: 'IP', category: 'software' }, field: 'asset' },
  { path: '/api/gsip/pipeline', method: 'GET', field: 'stages' },
  { path: '/api/gsip/revenue', method: 'POST', data: { assetId: 'asset_001', amount: 10, currency: 'USD' }, field: 'recorded' },
  { path: '/api/markets/opportunities', method: 'GET', field: 'opportunities' },
  { path: '/api/markets/trends', method: 'GET', field: 'trends' },
  { path: '/api/markets/forecast', method: 'GET', field: 'forecast' },
  { path: '/api/compliance/status', method: 'GET', field: 'areas' },
  { path: '/api/compliance/licenses', method: 'GET', field: 'licenses' },
  { path: '/api/compliance/audit', method: 'POST', data: { areas: ['IP', 'Licensing', 'Governance', 'Privacy', 'Risk'] }, field: 'id' },
  { path: '/api/store/catalog', method: 'GET', field: 'items' },
  { path: '/api/store/acquire', method: 'POST', data: { itemId: 'item_001' }, field: 'license' },
  { path: '/api/store/licenses', method: 'GET', field: 'licenses' },
];
function silence() { vi.spyOn(console, 'log').mockImplementation(() => {}); }
async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  const payload: unknown = await response.json();
  expect(payload).toEqual({ success: false, error: { code, message: expect.any(String) } });
  expect(JSON.stringify(payload)).not.toMatch(/stack|test-only-key/);
}
describe('route contracts', () => {
  it.each(['/', '/health', '/status', '/version'])('%s returns the exact public health contract', async path => {
    silence();
    const gateway = createGateway();
    const response = await gateway.fetch(request(path, 'GET', undefined, null), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, status: 'healthy', service: 'portal-os1-rabbit-worker', version: '1.0.0', timestamp: expect.stringMatching(/^\d{4}-\d\d-\d\dT.*Z$/) });
    await expectError(await gateway.fetch(request(path, 'POST'), {}), 405, 'METHOD_NOT_ALLOWED');
  });
  it.each(endpoints)('$method $path success, missing identity, invalid identity, wrong method', async endpoint => {
    silence();
    const gateway = createGateway();
    const response = await gateway.fetch(request(endpoint.path, endpoint.method, endpoint.data), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toMatch(/^[a-f0-9-]{36}$/);
    const payload: unknown = await response.json();
    expect(payload).toEqual({ success: true, timestamp: expect.any(String), data: expect.objectContaining({ mode: 'mock', [endpoint.field]: expect.anything() }) });
    await expectError(await gateway.fetch(request(endpoint.path, endpoint.method, endpoint.data, null), env), 401, 'UNAUTHORIZED');
    await expectError(await gateway.fetch(request(endpoint.path, endpoint.method, endpoint.data, 'x'.repeat(40)), env), 401, 'UNAUTHORIZED');
    const wrong = await gateway.fetch(request(endpoint.path, 'DELETE'), env);
    await expectError(wrong, 405, 'METHOD_NOT_ALLOWED');
    expect(wrong.headers.get('allow')).toContain(endpoint.method);
  });
  it.each(endpoints.filter(endpoint => endpoint.method === 'POST'))('$path rejects invalid bodies and unauthorized writes', async endpoint => {
    silence();
    const gateway = createGateway();
    for (const data of [{}, [], null, { ...endpoint.data, unexpected: true }]) {
      await expectError(await gateway.fetch(request(endpoint.path, 'POST', data), env), 400, 'INVALID_REQUEST');
    }
    const observer = { API_KEYS: JSON.stringify([{ id: 'observer', role: 'Observer', digest: await hashKey(key) }]) };
    await expectError(await gateway.fetch(request(endpoint.path, 'POST', endpoint.data), observer), 403, 'FORBIDDEN');
    await expectError(await gateway.fetch(request(endpoint.path, 'POST'), env), 415, 'UNSUPPORTED_MEDIA_TYPE');
  });
  it('reports unknown routes, unavailable auth, and sanitizes internal errors', async () => {
    silence(); const gateway = createGateway();
    await expectError(await gateway.fetch(request('/missing?secret=test'), env), 404, 'NOT_FOUND');
    await expectError(await gateway.fetch(request('/api/icv/context'), {}), 503, 'AUTH_UNAVAILABLE');
    vi.spyOn(icvService, 'context').mockImplementation(() => { throw new Error('private stack detail'); });
    await expectError(await gateway.fetch(request('/api/icv/context'), env), 500, 'INTERNAL_ERROR');
  });
  it('protects metrics and tracks requests, errors, latency and service health', async () => {
    silence(); const gateway = createGateway();
    await gateway.fetch(request('/health'), env);
    await gateway.fetch(request('/unknown'), env);
    await gateway.fetch(request('/api/icv/context'), {});
    const response = await gateway.fetch(request('/metrics'), env);
    expect(await response.json()).toEqual({ success: true, timestamp: expect.any(String), data: { scope: 'isolate', requestCount: 3, errorCount: 2, errorRate: 2 / 3, serverErrorCount: 1, serviceHealth: 'degraded', latency: { averageMs: expect.any(Number), p95Ms: expect.any(Number), sampleCount: 3 } } });
    await expectError(await gateway.fetch(request('/metrics', 'GET', undefined, null), env), 401, 'UNAUTHORIZED');
    await expectError(await gateway.fetch(request('/metrics', 'POST'), env), 405, 'METHOD_NOT_ALLOWED');
    const observer = { API_KEYS: JSON.stringify([{ id: 'observer', role: 'Observer', digest: await hashKey(key) }]) };
    await expectError(await gateway.fetch(request('/metrics'), observer), 403, 'FORBIDDEN');
  });
  it('logs only bounded route labels and generates its own trace identity', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const req = request('/secret-path?token=secret'); req.headers.set('X-Request-ID', 'attacker');
    const response = await createGateway().fetch(req, env);
    expect(response.headers.get('x-request-id')).not.toBe('attacker');
    const logged: unknown = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ event: 'request', route: 'unmatched', status: 404 });
    expect(JSON.stringify(logged)).not.toMatch(/secret|test-only-key|attacker/);
  });
});
describe('security units', () => {
  it('authenticates every supported role and rejects malformed credentials', async () => {
    for (const role of ['Founder', 'Admin', 'Operator', 'Observer'] as const) {
      expect(await authenticate(request('/'), { API_KEYS: JSON.stringify([{ id: role, role, digest: await hashKey(key) }, { id: 'other', role, digest: await hashKey('unmatched') }]) })).toEqual({ id: role, role });
    }
    for (const invalid of [null, '', 'short', 'x'.repeat(257), 'x'.repeat(40)]) {
      await expect(authenticate(request('/', 'GET', undefined, invalid), env)).rejects.toMatchObject({ status: 401 });
    }
    await expect(authenticate(request('/'), {})).rejects.toMatchObject({ status: 503 });
  });
  it('enforces the complete role/permission matrix', () => {
    const roles: Role[] = ['Founder', 'Admin', 'Operator', 'Observer'];
    const permissions: Permission[] = ['read', 'write', 'audit', 'metrics'];
    for (const role of roles) for (const permission of permissions) {
      const allowed = role === 'Founder' || role === 'Admin' || permission === 'read' || (role === 'Operator' && permission === 'write');
      if (allowed) expect(() => requirePermission(role, permission)).not.toThrow();
      else expect(() => requirePermission(role, permission)).toThrow('Permission denied');
    }
    for (const role of [...roles, 'owner', '__proto__', null, 1]) expect(isRole(role)).toBe(roles.includes(role as Role));
  });
  it('rejects invalid key configuration and duplicate digests', async () => {
    const valid = { id: 'id', role: 'Admin', digest: await hashKey(key) };
    const invalid = ['{', '{}', '[]', 'null', JSON.stringify([valid, valid]), ...[null, {}, { ...valid, id: '' }, { ...valid, id: 1 }, { ...valid, role: 'root' }, { ...valid, digest: 'invalid' }, { id: 'id', role: 'Admin' }, { id: 'id', digest: valid.digest }].map(value => JSON.stringify([value]))];
    for (const value of invalid) expect(() => parseKeys(value)).toThrow('Authentication is not configured');
    expect(equalDigest('abc', 'abd')).toBe(false);
    expect(equalDigest('abc', 'ab')).toBe(false);
    expect(equalDigest('abc', 'abc')).toBe(true);
  });
});
describe('input boundaries and service units', () => {
  it('rejects malformed JSON, empty streams, excessive bytes and invalid fields', async () => {
    silence(); const gateway = createGateway();
    for (const raw of ['{', '"text"', '']) {
      await expectError(await gateway.fetch(new Request('https://gateway.example/api/icv/coherence', { method: 'POST', headers: { 'X-API-Key': key, 'Content-Type': 'application/json' }, body: raw }), env), 400, 'INVALID_REQUEST');
    }
    await expectError(await gateway.fetch(new Request('https://gateway.example/api/icv/coherence', { method: 'POST', headers: { 'X-API-Key': key, 'Content-Type': 'application/json' } }), env), 400, 'INVALID_REQUEST');
    await expectError(await gateway.fetch(request('/api/icv/coherence', 'POST', { statement: 'a'.repeat(17000) }), env), 413, 'PAYLOAD_TOO_LARGE');
    for (const statement of ['', '   ', 10, 'a'.repeat(1001)]) await expectError(await gateway.fetch(request('/api/icv/coherence', 'POST', { statement }), env), 400, 'INVALID_REQUEST');
    for (const amount of [-1, 1e13, '10', null]) await expectError(await gateway.fetch(request('/api/gsip/revenue', 'POST', { assetId: 'a', amount, currency: 'USD' }), env), 400, 'INVALID_REQUEST');
    for (const currency of ['usd', 1, 'US']) await expectError(await gateway.fetch(request('/api/gsip/revenue', 'POST', { assetId: 'a', amount: 0, currency }), env), 400, 'INVALID_REQUEST');
    for (const areas of [null, [], ['unknown'], Array(6).fill('IP')]) await expectError(await gateway.fetch(request('/api/compliance/audit', 'POST', { areas }), env), 400, 'INVALID_REQUEST');
    await expectError(await gateway.fetch(request('/api/store/acquire', 'POST', { itemId: 'unknown' }), env), 404, 'ITEM_NOT_FOUND');
  });
  it('provides typed mock service results without mutating durable state', () => {
    expect(icvService.context().ecosystem).toBe('Umbrella');
    expect(icvService.identity({ id: 'a', role: 'Observer' }).id).toBe('a');
    expect(icvService.coherence({ statement: 'x' }).score).toBeGreaterThanOrEqual(0);
    expect(icvService.strategy({ objective: 'x' }).steps.length).toBeGreaterThan(0);
    expect(gsipService.assets().assets[0]).toEqual({ id: 'asset_001', title: 'Example IP asset', category: 'software', status: 'creation' });
    expect(gsipService.createAsset({ title: 'New', category: 'IP' })).toMatchObject({ persisted: false, asset: { title: 'New', status: 'creation' } });
    expect(gsipService.pipeline().stages[0]?.count).toBe(1);
    expect(gsipService.revenue({ assetId: 'a', amount: 0, currency: 'USD' }).recorded).toBe(false);
    expect(marketService.opportunities().opportunities[0]?.score).toBe(0.75);
    expect(marketService.trends().trends[0]?.direction).toBe('growing');
    expect(marketService.forecast().forecast.horizonDays).toBe(90);
    expect(complianceService.status().areas.map(item => item.area)).toEqual(['IP', 'Licensing', 'Governance', 'Privacy', 'Risk']);
    expect(complianceService.licenses().licenses[0]?.status).toBe('not_verified');
    expect(complianceService.audit({ areas: ['IP'] }).persisted).toBe(false);
    expect(storeService.catalog().items[0]?.licenseType).toBe('evaluation');
    expect(storeService.acquire({ itemId: 'item_001' }, { id: 'a', role: 'Operator' }).license.ownerId).toBe('a');
    expect(storeService.licenses().licenses).toEqual([]);
  });
  it('bounds metrics memory and defines empty metrics', () => {
    const metrics = new Metrics();
    expect(metrics.snapshot()).toMatchObject({ requestCount: 0, errorRate: 0, serviceHealth: 'healthy', latency: { averageMs: 0, p95Ms: 0 } });
    for (let i = 0; i < 1100; i++) metrics.record(200, i);
    expect(metrics.snapshot()).toMatchObject({ requestCount: 1100, latency: { sampleCount: 1024, p95Ms: 1048 } });
  });
});
