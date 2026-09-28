import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Register from './pages/Register';
// Institution
import InstitutionLayout from './components/layout/InstitutionLayout';
import InstitutionDashboardPage from './pages/institution/InstitutionDashboardPage';
import InstitutionOrdersPage from './pages/institution/InstitutionOrdersPage';
import InstitutionCoordinatorsPage from './pages/institution/InstitutionCoordinatorsPage';
import InstitutionProofingPage from './pages/institution/InstitutionProofingPage';
import NewOrderPage from './pages/institution/NewOrderPage';
// Coordinator
import CoordinatorLayout from './components/layout/CoordinatorLayout';
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboardPage';
import CoordinatorLookupPage from './pages/coordinator/CoordinatorLookupPage';
import CoordinatorStudentsPage from './pages/coordinator/CoordinatorStudentsPage';
import CoordinatorQuickAddPage from './pages/coordinator/CoordinatorQuickAddPage';
import CoordinatorProofingPage from './pages/coordinator/CoordinatorProofingPage';
// Operator
import OperatorDashboard from './pages/operator/OperatorDashboard';
import LayoutBuilderPage from './pages/operator/LayoutBuilderPage';
import BatchUploadPage from './pages/operator/BatchUploadPage';
import PipelinePage from './pages/operator/PipelinePage';
import ManualReviewPage from './pages/operator/ManualReviewPage';
import OperatorLayout from './components/layout/OperatorLayout';
import CoordinatorJoin from './pages/CoordinatorJoin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import InstitutionsPage from './pages/admin/InstitutionsPage';
import Operators from './pages/admin/Operators';
import Analytics from './pages/admin/Analytics';
import ProcessingLogsPage from './pages/admin/ProcessingLogsPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import DashboardReference from './pages/_unused/DashboardReference';
import KlikASnapRoadmap from './pages/_unused/RoadMap';
import AdminLayout from './components/layout/AdminLayout';
import AccountActivate from './pages/AccountActivate';
import ProofingPage from './pages/operator/ProofingPage';
import { ExportView } from './pages/operator/ExportView';

import './App.css';

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'OPERATOR') return <Navigate to="/operator/dashboard" replace />;
  if (user?.role === 'COORDINATOR') return <Navigate to="/coordinator/dashboard" replace />;
  return <Navigate to="/client/dashboard" replace />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('access_token');
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (!user && !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('access_token');
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (user || token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!['INSTITUTION', 'COORDINATOR'].includes(user.role ?? '')) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const OperatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'OPERATOR') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const CoordinatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'COORDINATOR') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// function ComingSoon({ label }: { label: string }) {
//   return (
//     <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
//       <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
//           <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
//         </svg>
//       </div>
//       <p className="text-[16px] font-semibold text-gray-700">{label}</p>
//       <p className="text-[13px] text-gray-400">This page is coming soon.</p>
//     </div>
//   )
// }

// Routes INSTITUTION users through the full InstitutionLayout with sub-pages.
// COORDINATOR users now have their own /coordinator/* route tree, so this
// router only needs to handle the INSTITUTION role.
function ClientLayoutRouter() {
  const { user } = useAuth()

  if (user?.role === 'COORDINATOR') {
    // COORDINATOR landed at /client/* — redirect to their canonical space
    return <Navigate to="/coordinator/dashboard" replace />
  }

  // INSTITUTION role — full sidebar layout with sub-page routing
  return (
    <InstitutionLayout>
      <Routes>
        <Route path="dashboard" element={<InstitutionDashboardPage />} />
        <Route path="orders" element={<InstitutionOrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="coordinators" element={<InstitutionCoordinatorsPage />} />
        <Route path="proofing" element={<InstitutionProofingPage />} />
        <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
      </Routes>
    </InstitutionLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Coordinator invite — fully public, no auth guard */}
          <Route path="/coordinator/join/:token" element={<CoordinatorJoin />} />

          <Route path="/activate/:token" element={<AccountActivate />} />

          {/* Root */}
          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

          {/* Client — INSTITUTION gets the full InstitutionLayout; COORDINATOR redirects to /coordinator/* */}
          <Route
            path="/client/*"
            element={
              <ClientRoute>
                <OrderProvider>
                  <ClientLayoutRouter />
                </OrderProvider>
              </ClientRoute>
            }
          />

          {/* Coordinator — full sidebar layout with its own route tree */}
          <Route
            path="/coordinator/*"
            element={
              <CoordinatorRoute>
                <OrderProvider>
                  <CoordinatorLayout>
                    <Routes>
                      <Route path="dashboard" element={<CoordinatorDashboardPage />} />
                      <Route path="lookup" element={<CoordinatorLookupPage />} />
                      <Route path="students" element={<CoordinatorStudentsPage />} />
                      <Route path="quick-add" element={<CoordinatorQuickAddPage />} />
                      <Route path="proofing" element={<CoordinatorProofingPage />} />
                      <Route path="*" element={<Navigate to="/coordinator/dashboard" replace />} />
                    </Routes>
                  </CoordinatorLayout>
                </OrderProvider>
              </CoordinatorRoute>
            }
          />

          {/* Operator */}
          <Route
            path="/operator/*"
            element={
              <OperatorRoute>
                <OrderProvider>
                  <OperatorLayout>
                    <Routes>
                      <Route path="dashboard" element={<OperatorDashboard />} />
                      <Route path="layout-builder" element={<LayoutBuilderPage />} />
                      <Route path="batch-upload" element={<BatchUploadPage />} />
                      <Route path="pipeline" element={<PipelinePage />} />
                      <Route path="manual-review" element={<ManualReviewPage />} />
                      <Route path="proofing" element={<ProofingPage />} />
                      <Route path="export" element={<ExportView />} />
                      <Route path="*" element={<Navigate to="/operator/dashboard" replace />} />
                    </Routes>
                  </OperatorLayout>
                </OrderProvider>
              </OperatorRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="institutions" element={<InstitutionsPage />} />
                    <Route path="operators" element={<Operators />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="logs/processing" element={<ProcessingLogsPage />} />
                    <Route path="logs/audit" element={<AuditLogPage />} />
                    <Route path="logs" element={<Navigate to="/admin/logs/processing" replace />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Misc */}
          <Route path="/operator/dashboard/reference" element={<DashboardReference />} />
          <Route path="/dashboard/roadmap" element={<KlikASnapRoadmap />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;