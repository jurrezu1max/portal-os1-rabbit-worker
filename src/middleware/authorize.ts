import { authenticate } from '../security/auth';
import { requirePermission } from '../security/permissions';
import type { Env, Identity, Permission } from '../types/contracts';
export async function authorize(request: Request, env: Env, permission: Permission): Promise<Identity> {
  const identity = await authenticate(request, env);
  requirePermission(identity.role, permission);
  return identity;
}
