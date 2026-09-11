import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import toast from "react-hot-toast";
import api from "../utils/api";

export default function AccountActivate() {
    const { token } = useParams<{ token: string }>()

    const [invite, setInvite] = useState<{
        username: string;
        email: string; 
        invite_type: string; 
    } | null>(null);
    const [invalid, setInvalid] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/auth/invite/${token}/`)
        .then(res => setInvite(res.data))
        .catch(err => setInvalid(err.response?.data?.error || 'Invalid or expired activation link'))
        .finally(() => setLoading(false));
    }, [token])

    const handleSubmit = async () => {
        if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        if (password !== confirm) { toast.error('Passwords do not match'); return; }

        setSubmitting(true);
        try {
            const res = await api.post(`/auth/invite/${token}/accept/`, { password })
            localStorage.setItem('access_token', res.data.tokens.access);
            localStorage.setItem('refresh_token', res.data.tokens.refresh)
            toast.success('Account activated! Welcome.')

            const inviteType = res.data.invite_type;
            if (inviteType === 'OPERATOR') {
                window.location.href = '/operator/dashboard';
            } else {
                window.location.href = '/client/dashboard';
            }


        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Validating activation link...</p>
        </div>
    )

    if (invalid) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
            <p className="text-2xl mb-4">🔗</p>
            <h2 className="font-black text-gray-900 mb-2">Activation Link Invalid</h2>
            <p className="text-sm text-gray-500">{invalid}</p>
          </div>
        </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-black text-gray-900 mb-1">QueueBits</h1>
        <p className="text-sm text-gray-500 mb-6">
          Activate your <span className="font-bold text-gray-700">
            {invite?.invite_type === 'OPERATOR' ? 'Operator' : 'Institution'}
          </span> account.
        </p>
        <p className="text-sm text-gray-700 mb-4">
          Hi, <span className="font-bold">{invite?.username}</span>! Set your password to get started.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Repeat your password"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Activating...' : 'Activate My Account'}
        </button>
      </div>
    </div>
  );
}