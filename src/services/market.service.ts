import type { Forecast, Opportunity, Trend } from '../types/contracts';
export const marketService = {
  opportunities: (): { opportunities: Opportunity[]; mode: 'mock' } => ({ opportunities: [{ id: 'opportunity_001', market: 'software', score: 0.75 }], mode: 'mock' }),
  trends: (): { trends: Trend[]; mode: 'mock' } => ({ trends: [{ market: 'software', direction: 'growing' }], mode: 'mock' }),
  forecast: (): { forecast: Forecast; mode: 'mock' } => ({ forecast: { market: 'software', horizonDays: 90, growthPercent: 5 }, mode: 'mock' }),
};
