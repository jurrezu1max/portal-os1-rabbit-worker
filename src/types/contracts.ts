export type Role = 'Founder' | 'Admin' | 'Operator' | 'Observer';
export type Permission = 'read' | 'write' | 'audit' | 'metrics';
export interface Identity { id: string; role: Role }
export interface Env { API_KEYS?: string }
export interface Success<T> { success: true; timestamp: string; data: T }
export interface Failure { success: false; error: { code: string; message: string } }
export interface Health { success: true; status: 'healthy'; service: 'portal-os1-rabbit-worker'; version: '1.0.0'; timestamp: string }
export interface Asset { id: string; title: string; category: string; status: 'creation' }
export interface AssetInput { title: string; category: string }
export interface CoherenceInput { statement: string }
export interface StrategyInput { objective: string }
export interface RevenueInput { assetId: string; amount: number; currency: string }
export type ComplianceArea = 'IP' | 'Licensing' | 'Governance' | 'Privacy' | 'Risk';
export interface AuditInput { areas: ComplianceArea[] }
export interface AcquireInput { itemId: string }
export interface CatalogItem { id: string; title: string; licenseType: 'evaluation' }
export interface License { id: string; itemId: string; ownerId: string; type: 'evaluation'; status: 'mock' }
export interface Opportunity { id: string; market: string; score: number }
export interface Trend { market: string; direction: 'stable' | 'growing' }
export interface Forecast { market: string; horizonDays: number; growthPercent: number }
