import React, { useState, useEffect } from 'react';
import type { Operator } from '../../hooks/useOperators';
import { useResetPassword } from '../../hooks/useOperators';

interface ResetPasswordModalProps {
  isOpen: boolean;
  operator: Operator | null;
  onClose: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  operator,
  onClose,
}) => {
  const [passwordCopied, setPasswordCopied] = useState(false);
  const { resetPassword, loading, error, success, tempPassword, reset } = useResetPassword();

  useEffect(() => {
    if (!isOpen) {
      setPasswordCopied(false);
      reset();
    }
  }, [isOpen, reset]);

  const handleConfirm = async () => {
    if (operator) {
      await resetPassword(operator.id);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setPasswordCopied(true);
    }
  };

  const handleClose = () => {
    if (success && tempPassword && !passwordCopied) {
      if (!window.confirm('You have not copied the password yet. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen || !operator) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
        </div>

        <div className="p-6 space-y-4">
          {!success ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-bold text-sm mb-2">⚠️ Confirm Password Reset</p>
                <p className="text-sm text-amber-700">
                  You are about to reset the password for <span className="font-bold">{operator.user__username}</span> ({operator.user__email}).
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  The current password will be invalidated immediately. A new temporary password will be generated.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-bold mb-2">✓ Password reset successfully!</p>
                <p className="text-sm text-green-700">
                  A new temporary password has been generated. Please save it below.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-bold text-sm mb-2">⚠️ Important</p>
                <p className="text-xs text-amber-700">
                  This password will not be shown again. Make sure to copy it before closing this window.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  New Temporary Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword || ''}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyPassword}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      passwordCopied
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {passwordCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
