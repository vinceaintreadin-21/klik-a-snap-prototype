/**
 * RBAC permissions hook — single source of truth for frontend access control.
 *
 * Roles map to the `UserProfile.Role` choices in the backend:
 *   ADMIN | OPERATOR | INSTITUTION | COORDINATOR
 *
 * Permission keys map to actual features in the current codebase.
 * Route guards in App.tsx still use role checks directly; this hook is used
 * for finer-grained UI gating (show/hide buttons, conditional renders, etc.)
 * via the <CanAccess> component or direct calls to `can()`.
 */

import { useAuth } from '../context/AuthContext'

export type Role = 'ADMIN' | 'OPERATOR' | 'INSTITUTION' | 'COORDINATOR'

// ── Permission map ─────────────────────────────────────────────────────────────
// Each key maps to the roles that are allowed to perform that action.
// Keep entries aligned with what's actually implemented — no aspirational entries.

export const PERMISSIONS = {

  // ── Admin portal (/admin/*) ────────────────────────────────────────────────

  /** View the admin operations dashboard (/admin/dashboard) */
  viewAdminDashboard:     ['ADMIN'] as Role[],

  /** View and filter all orders across institutions (/admin/orders) */
  viewAllOrders:          ['ADMIN'] as Role[],

  /** Assign an operator to an order */
  assignOperator:         ['ADMIN'] as Role[],

  /** Override an order status with a reason (audit-logged) */
  overrideOrderStatus:    ['ADMIN'] as Role[],

  /** View, create, suspend, activate institutions (/admin/institutions) */
  manageInstitutions:     ['ADMIN'] as Role[],

  /** View, create, deactivate, reset-password, delete operators (/admin/operators) */
  manageOperators:        ['ADMIN'] as Role[],

  /** View analytics charts and metrics (/admin/analytics) */
  viewAnalytics:          ['ADMIN'] as Role[],

  /** View processing logs (/admin/logs/processing) */
  viewProcessingLogs:     ['ADMIN'] as Role[],

  /** View audit log (/admin/logs/audit) */
  viewAuditLog:           ['ADMIN'] as Role[],

  // ── Operator workspace (/operator/*) ──────────────────────────────────────

  /** View the operator dashboard (/operator/dashboard) */
  viewOperatorDashboard:  ['OPERATOR'] as Role[],

  /** Open the layout builder for an order (/operator/layout-builder) */
  editLayout:             ['OPERATOR', 'ADMIN'] as Role[],

  /** Upload student photos for an order */
  uploadPhotos:           ['OPERATOR'] as Role[],

  /** Trigger the AI processing pipeline on an order */
  runAIProcessing:        ['OPERATOR'] as Role[],

  /** Review manually flagged students */
  manualReview:           ['OPERATOR'] as Role[],

  /** Proof / approve ID card output (/operator/proofing) */
  operatorProofing:       ['OPERATOR'] as Role[],

  /** Export / send to print (/operator/export) */
  exportIDs:              ['OPERATOR'] as Role[],

  /** View the batch upload wizard (/operator/batch-upload) */
  batchUpload:            ['OPERATOR'] as Role[],

  /** View the production pipeline (/operator/pipeline) */
  viewPipeline:           ['OPERATOR'] as Role[],

  // ── Client portal (/client/*) ─────────────────────────────────────────────

  /** Access the client dashboard (institution orders + coordinator view) */
  viewClientDashboard:    ['INSTITUTION', 'COORDINATOR'] as Role[],

  /** Create a new order */
  createOrder:            ['INSTITUTION'] as Role[],

  /** Approve / reject proofs on behalf of institution */
  institutionProofing:    ['INSTITUTION', 'COORDINATOR'] as Role[],

  /** Invite and manage coordinators */
  manageCoordinators:     ['INSTITUTION'] as Role[],

  /** View institution's own order history */
  viewOrderHistory:       ['INSTITUTION', 'COORDINATOR'] as Role[],

  /** Mark a student as photographed (coordinator action) */
  markPhotographed:       ['COORDINATOR'] as Role[],

  /** Add a walk-in student during a capture session */
  addWalkinStudent:       ['COORDINATOR'] as Role[],

  /** Search students in the coordinator's active session */
  coordinatorSearch:      ['COORDINATOR'] as Role[],

} as const

export type Permission = keyof typeof PERMISSIONS

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { user } = useAuth()
  const role = (user?.role ?? null) as Role | null

  /**
   * Returns true if the current user's role is allowed to perform `permission`.
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false
    return (PERMISSIONS[permission] as Role[]).includes(role)
  }

  /**
   * Returns true if the current user has ANY of the given roles.
   */
  const hasRole = (...roles: Role[]): boolean => {
    if (!role) return false
    return roles.includes(role)
  }

  /**
   * Returns true if the user has ALL of the given permissions.
   */
  const canAll = (...permissions: Permission[]): boolean =>
    permissions.every(can)

  /**
   * Returns true if the user has at least one of the given permissions.
   */
  const canAny = (...permissions: Permission[]): boolean =>
    permissions.some(can)

  /**
   * Convenience booleans for the most common role checks.
   */
  const isAdmin       = role === 'ADMIN'
  const isOperator    = role === 'OPERATOR'
  const isInstitution = role === 'INSTITUTION'
  const isCoordinator = role === 'COORDINATOR'

  return {
    role,
    can,
    hasRole,
    canAll,
    canAny,
    isAdmin,
    isOperator,
    isInstitution,
    isCoordinator,
  }
}
