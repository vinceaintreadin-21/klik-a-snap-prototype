import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

interface InstitutionProfile {
  id: number;
  name: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string | null;
  status: string;
}

interface Props {
  onClose: () => void;
}

const InstitutionProfileModal = ({ onClose }: Props) => {
  const [tab,     setTab]     = useState<'profile' | 'security' | 'coordinators'>('profile');
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Profile state
  const [name,          setName]          = useState('');
  const [address,       setAddress]       = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone,  setContactPhone]  = useState('');
  const [logoFile,      setLogoFile]      = useState<File | null>(null);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Coordinator state
  const [coordName,    setCoordName]    = useState('');
  const [coordEmail,   setCoordEmail]   = useState('');
  const [inviteUrl,    setInviteUrl]    = useState<string | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [inviting,     setInviting]     = useState(false);

  useEffect(() => {
    api.get('/institution/profile/')
      .then(res => {
        const data = res.data;
        setProfile(data);
        setName(data.name);
        setAddress(data.address);
        setContactPerson(data.contact_person);
        setContactPhone(data.contact_phone);
        setLogoPreview(data.logo_url);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'coordinators') return;
    api.get('/institution/coordinators/')
      .then(res => setCoordinators(res.data))
      .catch(() => {});
  }, [tab]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name',           name);
      formData.append('address',        address);
      formData.append('contact_person', contactPerson);
      formData.append('contact_phone',  contactPhone);
      if (logoFile) formData.append('logo', logoFile);
      await api.patch('/institution/profile/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    setSaving(true);
    try {
      await api.post('/institution/profile/change-password/', {
        current_password: currentPassword,
        new_password:     newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!coordName.trim() || !coordEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.post('/institution/coordinators/invite/', {
        name:     coordName,
        email:    coordEmail,
        base_url: window.location.origin,
      });
      setInviteUrl(res.data.invite_url);
      setCoordName('');
      setCoordEmail('');
      toast.success('Invite link generated');
      // Refresh coordinator list
      const list = await api.get('/institution/coordinators/');
      setCoordinators(list.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create invite');
    } finally {
      setInviting(false);
    }
  };

  const TAB_LABELS: Record<string, string> = {
    profile:      'Profile Info',
    security:     'Security',
    coordinators: 'Coordinators',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">My Institution Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['profile', 'security', 'coordinators'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                tab === t
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">Loading...</div>

        ) : tab === 'profile' ? (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Institution Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Contact Person</label>
              <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Contact Phone</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                )}
                <label className="cursor-pointer px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Choose new file
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

        ) : tab === 'security' ? (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={handleChangePassword} disabled={saving}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </div>

        ) : (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Invite form */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide">Invite a Coordinator</h3>
              <input
                value={coordName}
                onChange={e => setCoordName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                value={coordEmail}
                onChange={e => setCoordEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !coordName.trim() || !coordEmail.trim()}
                className="w-full py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Generating...' : 'Generate Invite Link'}
              </button>

              {inviteUrl && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-600">Share this link with the coordinator:</p>
                  <p className="text-xs text-gray-700 font-mono break-all">{inviteUrl}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success('Copied!'); }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Coordinator list */}
            {coordinators.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Active Coordinators</h3>
                <div className="space-y-2">
                  {coordinators.map((c: any) => (
                    <div key={c['user__id']} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{c['user__first_name']}</p>
                        <p className="text-xs text-gray-400">{c['user__email']}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.is_active ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionProfileModal;