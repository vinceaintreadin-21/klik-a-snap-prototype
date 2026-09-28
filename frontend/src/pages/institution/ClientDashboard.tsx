/**
 * ClientDashboard — entry point for the /client/* routes.
 *
 * COORDINATOR users get their own lightweight capture view.
 * INSTITUTION users are handled by InstitutionDashboardPage under InstitutionLayout,
 * so this component only needs to dispatch to CoordinatorDashboard.
 * The institution routing is done fully in App.tsx via <InstitutionLayout>.
 */
import { useAuth } from '../../context/AuthContext'
import CoordinatorDashboard from '../coordinator/CoordinatorDashboard'
import InstitutionDashboardPage from './InstitutionDashboardPage'

const ClientDashboard = () => {
  const { user } = useAuth()

  if (user?.role === 'COORDINATOR') {
    return <CoordinatorDashboard />
  }

  // INSTITUTION role — render the new dashboard page directly.
  // The InstitutionLayout (sidebar + topbar) wraps this at the route level in App.tsx.
  return <InstitutionDashboardPage />
}

export default ClientDashboard
