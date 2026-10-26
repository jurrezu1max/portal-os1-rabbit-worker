export class Metrics {
  private requests = 0;
  private errors = 0;
  private serverErrors = 0;
  private totalMs = 0;
  private samples: number[] = [];
  record(status: number, durationMs: number): void {
    this.requests++;
    if (status >= 400) this.errors++;
    if (status >= 500) this.serverErrors++;
    this.totalMs += durationMs;
    if (this.samples.length === 1024) this.samples.shift();
    this.samples.push(durationMs);
  }
  snapshot() {
    const sorted = [...this.samples].sort((a, b) => a - b);
    return { scope: 'isolate' as const, requestCount: this.requests, errorCount: this.errors,
      errorRate: this.requests ? this.errors / this.requests : 0,
      serverErrorCount: this.serverErrors,
      latency: { averageMs: this.requests ? this.totalMs / this.requests : 0, p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0, sampleCount: sorted.length },
      serviceHealth: this.serverErrors ? 'degraded' as const : 'healthy' as const };
  }
}
