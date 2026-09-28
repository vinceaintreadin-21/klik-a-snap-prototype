/**
 * CoordinatorDashboard — entry point for coordinator role.
 *
 * COORDINATOR users coming through /client/dashboard land here via
 * ClientDashboard, but the full coordinator experience is routed at
 * /coordinator/* through CoordinatorLayout in App.tsx.
 *
 * This shim just redirects to the canonical coordinator route so the
 * routing is consistent whether the user lands at /client/dashboard or /coordinator/dashboard.
 */
import { Navigate } from 'react-router-dom'

const CoordinatorDashboard = () => {
  return <Navigate to="/coordinator/dashboard" replace />
}

export default CoordinatorDashboard
