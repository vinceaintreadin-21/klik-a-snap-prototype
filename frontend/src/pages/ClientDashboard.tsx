import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OrderInitiator from '../components/OrderInitiator';
import OrderList from '../components/OrderList';
import InstitutionProfileModal from '../components/InstitutionProfileModal';
import CoordinatorDashboard from './CoordinatorDashboard';
import { useOrders } from '../context/OrderContext';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { clearOrders } = useOrders();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => logout(clearOrders);

  // Coordinators get their own view
  if (user?.role === 'COORDINATOR') {
    return <CoordinatorDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Klik-a-Snap</h1>
            <p className="text-gray-500 font-medium">Welcome back, {user?.username}!</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setProfileOpen(true)}
              className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              ⚙ My Profile
            </button>
            <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section>
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm mr-3">1</span>
              Create New Batch
            </h2>
            <OrderInitiator />
          </section>
          <section>
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm mr-3">2</span>
              Your Active Orders
            </h2>
            <OrderList />
          </section>
        </main>
      </div>

      {profileOpen && (
        <InstitutionProfileModal onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default ClientDashboard;