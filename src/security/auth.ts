import type { Env, Identity } from '../types/contracts';
import { HttpError } from '../utils/http';
import { equalDigest, hashKey, parseKeys } from './keys';
export async function authenticate(request: Request, env: Env): Promise<Identity> {
  if (!env.API_KEYS) throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is not configured');
  const keys = parseKeys(env.API_KEYS);
  const key = request.headers.get('X-API-Key');
  if (!key || key.length < 32 || key.length > 256) throw new HttpError(401, 'UNAUTHORIZED', 'A valid API key is required');
  const digest = await hashKey(key);
  let identity: Identity | undefined;
  for (const candidate of keys) {
    if (equalDigest(candidate.digest, digest)) identity = { id: candidate.id, role: candidate.role };
  }
  if (!identity) throw new HttpError(401, 'UNAUTHORIZED', 'A valid API key is required');
  return identity;
}
