/**
 * CanAccess — declarative permission guard component.
 *
 * Usage:
 *   <CanAccess permission="manageOperators">
 *     <CreateOperatorButton />
 *   </CanAccess>
 *
 *   <CanAccess role="ADMIN" fallback={<p>Access denied</p>}>
 *     <AdminPanel />
 *   </CanAccess>
 */

import type { ReactNode } from 'react'
import { usePermissions, type Permission, type Role } from '../../hooks/usePermissions'

interface Props {
  /** Check a named permission */
  permission?: Permission
  /** Check a specific role (or multiple roles) */
  role?: Role | Role[]
  /** Rendered when access is denied. Defaults to null. */
  fallback?: ReactNode
  children: ReactNode
}

export default function CanAccess({ permission, role, fallback = null, children }: Props) {
  const { can, hasRole } = usePermissions()

  let allowed = true

  if (permission) {
    allowed = allowed && can(permission)
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role]
    allowed = allowed && hasRole(...roles)
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}
