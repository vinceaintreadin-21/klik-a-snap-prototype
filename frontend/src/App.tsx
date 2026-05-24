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
import KlikASnapRoadmap from './pages/RoadMap';

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

          {/* Admin Routes */}
          <Route 
            path="/admin/operators" 
            element={
              <ProtectedRoute>
                <Operators />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/institutions" 
            element={
              <ProtectedRoute>
                <InstitutionsPage />
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