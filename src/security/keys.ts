import type { Identity } from '../types/contracts';
import { isRole } from './permissions';
import { HttpError } from '../utils/http';
export interface KeyRecord extends Identity { digest: string }
export async function hashKey(key: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function parseKeys(configuration: string): KeyRecord[] {
  const invalid = (): never => { throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is not configured'); };
  let value: unknown;
  try { value = JSON.parse(configuration); } catch { return invalid(); }
  if (!Array.isArray(value) || value.length === 0) return invalid();
  const records: KeyRecord[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== 'object' || item === null || !('id' in item) || typeof item.id !== 'string' || !item.id.trim() || !('role' in item) || !isRole(item.role) || !('digest' in item) || typeof item.digest !== 'string' || !/^[a-f0-9]{64}$/.test(item.digest) || records.some(record => record.digest === item.digest)) return invalid();
    records.push({ id: item.id, role: item.role, digest: item.digest });
  }
  return records;
}
// Fixed-length digest comparison avoids secret-prefix timing comparisons.
export function equalDigest(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
