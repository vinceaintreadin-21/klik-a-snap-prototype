import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useOperators,
  useUpdateOperator,
  useDeleteOperator,
} from '../hooks/useOperators';
import type { Operator } from '../hooks/useOperators'
import OperatorTable from '../components/operators/OperatorTable';
import CreateOperatorModal from '../components/operators/CreateOperatorModal';
import DeactivateOperatorModal from '../components/operators/DeactivateOperatorModal';
import ActivateOperatorModal from '../components/operators/ActivateOperatorModal';
import ResetPasswordModal from '../components/operators/ResetPasswordModal';
import DeleteOperatorModal from '../components/operators/DeleteOperatorModal';

const Operators: React.FC = () => {
  const navigate = useNavigate();
  // Fetch operators list
  const { operators, loading, error, refetch } = useOperators();

  // Mutation hooks
  const updateOperator = useUpdateOperator(() => {
    refetch();
    setToastMessage('Operator updated successfully');
    setShowToast(true);
  });

  const deleteOperator = useDeleteOperator(() => {
    refetch();
    setToastMessage('Operator deleted successfully');
    setShowToast(true);
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Filter operators based on search and status
  const filteredOperators = operators
    ? operators.filter((op) => {
        // Search filter
        const matchesSearch =
          searchQuery === '' ||
          op.user__username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          op.user__email.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && op.is_active) ||
          (statusFilter === 'inactive' && !op.is_active);

        return matchesSearch && matchesStatus;
      })
    : [];

  // Calculate stats
  const totalOperators = operators?.length || 0;
  const activeOperators = operators?.filter((op) => op.is_active).length || 0;
  const inactiveOperators = totalOperators - activeOperators;

  // Handler functions
  const handleDeactivate = (operator: Operator) => {
    setSelectedOperator(operator);
    setDeactivateModalOpen(true);
  };

  const handleActivate = (operator: Operator) => {
    setSelectedOperator(operator);
    setActivateModalOpen(true);
  };

  const handleResetPassword = (operator: Operator) => {
    setSelectedOperator(operator);
    setResetPasswordModalOpen(true);
  };

  const handleDelete = (operator: Operator) => {
    setSelectedOperator(operator);
    setDeleteModalOpen(true);
  };

  const confirmDeactivate = async (id: number) => {
    const success = await updateOperator.updateOperator(id, { is_active: false });
    if (success) {
      setDeactivateModalOpen(false);
      setSelectedOperator(null);
    }
  };

  const confirmActivate = async (id: number) => {
    const success = await updateOperator.updateOperator(id, { is_active: true });
    if (success) {
      setActivateModalOpen(false);
      setSelectedOperator(null);
    }
  };

  const confirmDelete = async (id: number) => {
    const success = await deleteOperator.deleteOperator(id);
    if (success) {
      setDeleteModalOpen(false);
      setSelectedOperator(null);
    }
  };

  const handleCreateSuccess = () => {
    refetch();
    setCreateModalOpen(false);
    setToastMessage('Operator created successfully');
    setShowToast(true);
  };

  const handleResetPasswordClose = () => {
    setResetPasswordModalOpen(false);
    setSelectedOperator(null);
    refetch(); // Refresh to show updated last_password_reset
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Operator Management</h1>
          <p className="text-gray-600">Manage operator accounts, permissions, and access</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Operators</p>
            <p className="text-3xl font-bold text-gray-900">{totalOperators}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeOperators}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Inactive</p>
            <p className="text-3xl font-bold text-gray-600">{inactiveOperators}</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => refetch()}
                className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Refresh
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all"
              >
                + Create Operator
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <p className="font-bold mb-1">Error loading operators</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Operators Table */}
        <OperatorTable
          operators={filteredOperators}
          loading={loading}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />

        {/* Modals */}
        <CreateOperatorModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        <DeactivateOperatorModal
          isOpen={deactivateModalOpen}
          operator={selectedOperator}
          onClose={() => {
            setDeactivateModalOpen(false);
            setSelectedOperator(null);
          }}
          onConfirm={confirmDeactivate}
          loading={updateOperator.loading}
        />

        <ActivateOperatorModal
          isOpen={activateModalOpen}
          operator={selectedOperator}
          onClose={() => {
            setActivateModalOpen(false);
            setSelectedOperator(null);
          }}
          onConfirm={confirmActivate}
          loading={updateOperator.loading}
        />

        <ResetPasswordModal
          isOpen={resetPasswordModalOpen}
          operator={selectedOperator}
          onClose={handleResetPasswordClose}
        />

        <DeleteOperatorModal
          isOpen={deleteModalOpen}
          operator={selectedOperator}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedOperator(null);
            deleteOperator.reset();
          }}
          onConfirm={confirmDelete}
          loading={deleteOperator.loading}
          error={deleteOperator.error}
        />

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <span className="text-xl">✓</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Operators;
