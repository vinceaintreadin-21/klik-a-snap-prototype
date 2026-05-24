import React, { useState, useEffect } from 'react';
import { useCreateOperator } from '../../hooks/useOperators';

interface CreateOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOperatorModal: React.FC<CreateOperatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { createOperator, loading, error, success, tempPassword, reset } = useCreateOperator(() => {
    onSuccess();
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setUsername('');
      setEmail('');
      setPasswordCopied(false);
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOperator({ username: username.trim(), email: email.trim() });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Operator</h2>
        </div>

        <div className="p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter email"
                  required
                  disabled={loading}
                />
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
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading || !username.trim() || !email.trim()}
                >
                  {loading ? 'Creating...' : 'Create Operator'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-bold mb-2">✓ Operator created successfully!</p>
                <p className="text-sm text-green-700">
                  The operator account has been created. Please save the temporary password below.
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
                  Temporary Password
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOperatorModal;
