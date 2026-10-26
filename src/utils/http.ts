import type { Failure, Success } from '../types/contracts';
export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function success<T>(data: T, status = 200): Response {
  return json({ success: true, timestamp: new Date().toISOString(), data } satisfies Success<T>, status);
}
export function failure(error: unknown): Response {
  const safe = error instanceof HttpError ? error : new HttpError(500, 'INTERNAL_ERROR', 'An internal error occurred');
  return json({ success: false, error: { code: safe.code, message: safe.message } } satisfies Failure, safe.status);
}
