import type { Health } from '../types/contracts';
import { json } from '../utils/http';
export const healthPaths = ['/', '/health', '/status', '/version'];
export function health(): Response {
  return json({ success: true, status: 'healthy', service: 'portal-os1-rabbit-worker', version: '1.0.0', timestamp: new Date().toISOString() } satisfies Health);
}
