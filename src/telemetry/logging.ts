export interface RequestLog { requestId: string; route: string; method: string; status: number; durationMs: number }
export function logRequest(event: RequestLog): void {
  console.log(JSON.stringify({ event: 'request', ...event }));
}
