import type { Identity, Permission } from '../types/contracts';
export interface Route {
  method: 'GET' | 'POST'; path: string; permission: Permission;
  handle: (request: Request, identity: Identity) => Promise<Response>;
}
