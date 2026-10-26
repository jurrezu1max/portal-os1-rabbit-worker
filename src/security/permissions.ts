import type { Permission, Role } from '../types/contracts';
import { HttpError } from '../utils/http';
const grants: Record<Role, readonly Permission[]> = {
  Founder: ['read', 'write', 'audit', 'metrics'], Admin: ['read', 'write', 'audit', 'metrics'],
  Operator: ['read', 'write'], Observer: ['read'],
};
export function isRole(value: unknown): value is Role {
  return value === 'Founder' || value === 'Admin' || value === 'Operator' || value === 'Observer';
}
export function requirePermission(role: Role, permission: Permission): void {
  if (!grants[role].includes(permission)) throw new HttpError(403, 'FORBIDDEN', 'Permission denied');
}
