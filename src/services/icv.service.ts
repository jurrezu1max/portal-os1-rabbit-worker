import type { CoherenceInput, Identity, StrategyInput } from '../types/contracts';
export const icvService = {
  context: () => ({ ecosystem: 'Umbrella', mode: 'mock' as const, capabilities: ['ICV', 'GS-IP', 'Markets', 'Compliance', 'Store'] }),
  identity: (identity: Identity) => ({ ...identity, mode: 'mock' as const }),
  coherence: (input: CoherenceInput) => ({ statement: input.statement, score: 0.85, mode: 'mock' as const }),
  strategy: (input: StrategyInput) => ({ objective: input.objective, steps: ['Assess context', 'Validate assumptions'], mode: 'mock' as const }),
};
