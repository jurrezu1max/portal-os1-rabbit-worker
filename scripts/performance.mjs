import assert from 'node:assert/strict';
const base = process.env.GATEWAY_URL ?? 'http://localhost:8787';
const key = process.env.GATEWAY_API_KEY;
if (!key) throw new Error('Set GATEWAY_API_KEY to a configured local API key');
const probes = [
  ['GET', '/', undefined], ['GET', '/health', undefined], ['GET', '/status', undefined], ['GET', '/version', undefined],
  ['GET', '/api/icv/context', undefined], ['GET', '/api/icv/identity', undefined],
  ['POST', '/api/icv/coherence', { statement: 'local verification' }], ['POST', '/api/icv/strategy', { objective: 'local verification' }],
  ['GET', '/api/gsip/assets', undefined], ['POST', '/api/gsip/assets', { title: 'Local asset', category: 'software' }],
  ['GET', '/api/gsip/pipeline', undefined], ['POST', '/api/gsip/revenue', { assetId: 'asset_001', amount: 1, currency: 'USD' }],
  ['GET', '/api/markets/opportunities', undefined], ['GET', '/api/markets/trends', undefined], ['GET', '/api/markets/forecast', undefined],
  ['GET', '/api/compliance/status', undefined], ['GET', '/api/compliance/licenses', undefined], ['POST', '/api/compliance/audit', { areas: ['IP'] }],
  ['GET', '/api/store/catalog', undefined], ['POST', '/api/store/acquire', { itemId: 'item_001' }], ['GET', '/api/store/licenses', undefined], ['GET', '/metrics', undefined],
];
for (const [method, path, body] of probes) {
  const timings = [];
  for (let i = 0; i < 55; i++) {
    const start = performance.now();
    const response = await fetch(new URL(path, base), { method, headers: { 'X-API-Key': key, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(response.status, 200, `${method} ${path}`);
    assert.equal((await response.json()).success, true);
    if (i >= 5) timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
  const max = timings.at(-1);
  const health = !path.startsWith('/api/') && path !== '/metrics';
  assert.ok(health ? max < 50 : p95 < 100, `${path} exceeded local latency target`);
  console.log(`${method} ${path}: p95=${p95.toFixed(2)}ms max=${max.toFixed(2)}ms (50 warm samples)`);
}
const unauthorized = await fetch(new URL('/api/icv/context', base));
assert.equal(unauthorized.status, 401);
assert.equal((await unauthorized.json()).error.code, 'UNAUTHORIZED');
console.log('Workerd route, authentication, and latency smoke checks passed.');
