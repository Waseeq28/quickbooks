export type TeamRole = 'admin' | 'accountant' | 'viewer'

export type Action =
  | 'team:read'
  | 'team:update'
  | 'member:read'
  | 'member:update'
  | 'member:remove'
  | 'member:invite'
  | 'invoice:read'
  | 'invoice:create'
  | 'invoice:delete'

const actionsOfRole: Record<TeamRole, Set<Action>> = {
  admin: new Set([
    'team:read', 'team:update',
    'member:read', 'member:update', 'member:remove', 'member:invite',
    'invoice:read', 'invoice:create', 'invoice:delete',
  ]),
  accountant: new Set([
    'team:read',
    'member:read',
    'invoice:read', 'invoice:create', 'invoice:delete',
  ]),
  viewer: new Set([
    'team:read',
    'member:read',
    'invoice:read',
  ]),
}

export function canRole(role: TeamRole | null | undefined, action: Action): boolean {
  if (!role) return false
  return actionsOfRole[role].has(action)
}

export function toTitleCaseRole(role: TeamRole): 'Admin'|'Accountant'|'Viewer' {
  return role === 'admin' ? 'Admin' : role === 'accountant' ? 'Accountant' : 'Viewer'
}


