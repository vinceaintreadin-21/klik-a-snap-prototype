import React from 'react';
import type { Operator } from '../../hooks/useOperators';
import StatusBadge from './StatusBadge';

interface OperatorTableProps {
  operators: Operator[];
  loading: boolean;
  onDeactivate: (operator: Operator) => void;
  onActivate: (operator: Operator) => void;
  onResetPassword: (operator: Operator) => void;
  onDelete: (operator: Operator) => void;
}

const OperatorTable: React.FC<OperatorTableProps> = ({
  operators,
  loading,
  onDeactivate,
  onActivate,
  onResetPassword,
  onDelete,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500">Loading operators...</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500">No operators found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Username</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date Joined</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Password Reset</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {operators.map((operator) => (
            <tr key={operator.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{operator.user__username}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{operator.user__email}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge isActive={operator.is_active} />
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{formatDate(operator.user__date_joined)}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{formatDate(operator.last_password_reset)}</p>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {operator.is_active ? (
                  <button
                    onClick={() => onDeactivate(operator)}
                    className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(operator)}
                    className="px-3 py-1.5 text-xs font-bold border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => onResetPassword(operator)}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => onDelete(operator)}
                  className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperatorTable;
