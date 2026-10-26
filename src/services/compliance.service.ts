import type { AuditInput, ComplianceArea } from '../types/contracts';
const tracked: ComplianceArea[] = ['IP', 'Licensing', 'Governance', 'Privacy', 'Risk'];
export const complianceService = {
  status: () => ({ areas: tracked.map(area => ({ area, status: 'not_assessed' as const })), mode: 'mock' as const }),
  licenses: () => ({ licenses: [{ id: 'license_example', status: 'not_verified' as const }], mode: 'mock' as const }),
  audit: (input: AuditInput) => ({ id: `audit_${crypto.randomUUID()}`, areas: input.areas, status: 'simulated' as const, persisted: false, mode: 'mock' as const }),
};
