import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Operators from './pages/Operators';
import InstitutionsPage from './pages/InstitutionsPage';
import DashboardReference from './pages/DashboardReference'
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import AdminOrders from './pages/AdminOrders';
import KlikASnapRoadmap from './pages/RoadMap';
import AdminLayout from './components/layout/AdminLayout';

import './App.css';

// --- PROTECTED ROUTE COMPONENT ---
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Private Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <OrderProvider>
                  <Dashboard />
                </OrderProvider>
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes — all share the dark AdminLayout shell */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
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
              </ProtectedRoute>
            }
          />


          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* Dashboard References */}
          <Route path="/operator/dashboard/reference" element={<DashboardReference />}/>
          <Route path="/dashboard/roadmap" element={<KlikASnapRoadmap />}/>


          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;