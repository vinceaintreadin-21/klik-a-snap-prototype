import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      const serverErrors = err.response?.data;
      console.log("Raw Server Errors:", serverErrors);

      if (typeof serverErrors === 'string' && serverErrors.includes('<!doctype')) {
        setError("Server error. Please try again or contact support.");
      } else if (serverErrors) {
        if (Array.isArray(serverErrors)) {
          setError(serverErrors[0]);
        } else if (serverErrors.non_field_errors) {
          setError(serverErrors.non_field_errors[0]);
        } else {
          const firstField = Object.keys(serverErrors)[0];
          const message = serverErrors[firstField];
          setError(`${firstField}: ${Array.isArray(message) ? message[0] : message}`);
        }
      } else {
        setError("Registration failed. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Klik-a-Snap for AI ID Production
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="johndoe123"
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="john@school.edu"
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="Minimum 8 characters"
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-all shadow-md active:scale-95 ${
              isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;