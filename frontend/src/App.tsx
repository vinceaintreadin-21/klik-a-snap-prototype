import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import CoordinatorJoin from './pages/CoordinatorJoin';
import Operators from './pages/Operators';
import InstitutionsPage from './pages/InstitutionsPage';
import DashboardReference from './pages/DashboardReference';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import AdminOrders from './pages/AdminOrders';
import KlikASnapRoadmap from './pages/RoadMap';
import AdminLayout from './components/layout/AdminLayout';

import './App.css';

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN')    return <Navigate to="/admin/orders" replace />;
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
                  <Routes>
                    <Route path="dashboard" element={<OperatorDashboard />} />
                    <Route path="*"         element={<Navigate to="/operator/dashboard" replace />} />
                  </Routes>
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
                    <Route path="orders"       element={<AdminOrders />} />
                    <Route path="institutions" element={<InstitutionsPage />} />
                    <Route path="operators"    element={<Operators />} />
                    <Route path="analytics"    element={<Analytics />} />
                    <Route path="logs"         element={<Logs />} />
                    <Route path="*"            element={<Navigate to="/admin/orders" replace />} />
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