import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import LayoutBuilderPage from './pages/LayoutBuilderPage';
import BatchUploadPage from './pages/operator/BatchUploadPage';
import PipelinePage from './pages/operator/PipelinePage';
import ManualReviewPage from './pages/operator/ManualReviewPage';
import OperatorLayout from './components/layout/OperatorLayout';
import CoordinatorJoin from './pages/CoordinatorJoin';
import Operators from './pages/Operators';
import InstitutionsPage from './pages/InstitutionsPage';
import DashboardReference from './pages/DashboardReference';
import Analytics from './pages/Analytics';
import ProcessingLogsPage from './pages/ProcessingLogsPage';
import AuditLogPage from './pages/AuditLogPage';
import AdminOrders from './pages/AdminOrders';
import AdminDashboard from './pages/AdminDashboard';
import KlikASnapRoadmap from './pages/RoadMap';
import AdminLayout from './components/layout/AdminLayout';
import AccountActivate from './pages/AccountActivate';
import ProofingPage from './pages/ProofingPage';

import './App.css';

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN')    return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'OPERATOR') return <Navigate to="/operator/dashboard" replace />;
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

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-gray-700">{label}</p>
      <p className="text-[13px] text-gray-400">This page is coming soon.</p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Coordinator invite — fully public, no auth guard */}
          <Route path="/coordinator/join/:token" element={<CoordinatorJoin />} />

          <Route path="/activate/:token" element={<AccountActivate />} />

          {/* Root */}
          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

          {/* Client (INSTITUTION / COORDINATOR) */}
          <Route
            path="/client/*"
            element={
              <ClientRoute>
                <OrderProvider>
                  <Routes>
                    <Route path="dashboard" element={<ClientDashboard />} />
                    <Route path="*"         element={<Navigate to="/client/dashboard" replace />} />
                  </Routes>
                </OrderProvider>
              </ClientRoute>
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
                      <Route path="dashboard"      element={<OperatorDashboard />} />
                      <Route path="layout-builder" element={<LayoutBuilderPage />} />
                      <Route path="batch-upload"   element={<BatchUploadPage />} />
                      <Route path="pipeline"       element={<PipelinePage />} />
                      <Route path="manual-review"  element={<ManualReviewPage />} />
                      <Route path="proofing"       element={<ProofingPage />} />
                      <Route path="export"         element={<ComingSoon label="Export" />} />
                      <Route path="*"              element={<Navigate to="/operator/dashboard" replace />} />
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
                    <Route path="dashboard"    element={<AdminDashboard />} />
                    <Route path="orders"       element={<AdminOrders />} />
                    <Route path="institutions" element={<InstitutionsPage />} />
                    <Route path="operators"    element={<Operators />} />
                    <Route path="analytics"        element={<Analytics />} />
                    <Route path="logs/processing"  element={<ProcessingLogsPage />} />
                    <Route path="logs/audit"       element={<AuditLogPage />} />
                    <Route path="logs"             element={<Navigate to="/admin/logs/processing" replace />} />
                    <Route path="*"            element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Misc */}
          <Route path="/operator/dashboard/reference" element={<DashboardReference />} />
          <Route path="/dashboard/roadmap"            element={<KlikASnapRoadmap />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;