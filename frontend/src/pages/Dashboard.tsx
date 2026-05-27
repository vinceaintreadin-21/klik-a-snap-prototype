import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderInitiator from '../components/OrderInitiator';
import OrderList from '../components/OrderList';
import OperatorDashboard from '../components/OperatorDashboard';

const Dashboard = () => {
  const [view, setView] = useState<'client' | 'operator'>('client');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Klik-a-Snap</h1>
            <p className="text-gray-500 font-medium">Welcome back, {user?.username}!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
              <button 
                onClick={() => setView('client')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'client' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Client Portal
              </button>
              
              {/* Only show Operator Dashboard if user is staff */}
              {user?.is_staff && (
                <button 
                  onClick={() => setView('operator')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    view === 'operator' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Operator Dashboard
                </button>
              )}
            </nav>
            
            {/* Admin link to Operator Management */}
            {user?.role === 'ADMIN' && (
              <>
                <button 
                  onClick={() => setView('operator')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    view === 'operator' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Operator Dashboard
                </button>
                
                <button
                  onClick={() => navigate('/admin/operators')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md"
                >
                  Manage Operators
                </button>

                <button
                  onClick={() => navigate('/admin/institutions')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  Manage Institutions
                </button>
              </>
              
              
            )}
            
            <button onClick={logout} className="text-sm font-bold text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <main>
          {view === 'client' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section>
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                  Create New Batch
                </h2>
                <OrderInitiator />
              </section>
              <section>
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm mr-3">3</span>
                  Your Active Orders
                </h2>
                <OrderList />
              </section>
            </div>
          ) : (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                  Production Queue
                </h2>
              <OperatorDashboard />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;