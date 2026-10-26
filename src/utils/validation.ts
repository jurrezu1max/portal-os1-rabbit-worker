import { HttpError } from './http';
const invalid = (): never => { throw new HttpError(400, 'INVALID_REQUEST', 'Request body does not match the route contract'); };
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
  if (!request.body) return invalid();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16384) { await reader.cancel(); throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 16 KiB'); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); } catch { return invalid(); }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return invalid();
  return parsed as Record<string, unknown>;
}
export function fields(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid();
}
export function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 1000) return invalid();
  return value.trim();
}
export function amount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12) return invalid();
  return value;
}
export function currency(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) return invalid();
  return value;
}
export function areas(value: unknown): import('../types/contracts').ComplianceArea[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 5) return invalid();
  return (value as unknown[]).map(item => {
    if (item !== 'IP' && item !== 'Licensing' && item !== 'Governance' && item !== 'Privacy' && item !== 'Risk') return invalid();
    return item;
  });
}
