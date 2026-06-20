import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import api from '../utils/api';
import ProofingModal from '../components/proofing/ProofingModal';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

// ── QR Display Modal ──────────────────────────────────────────────────────────
const QRModal = ({ student, onClose }: { student: any; onClose: () => void }) =>
  createPortal(
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] cursor-pointer px-6"
      onClick={onClose}
    >
      {student.qr_code_url ? (
        <img src={student.qr_code_url} className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl" alt="QR Code" />
      ) : (
        <div className="w-56 h-56 sm:w-72 sm:h-72 bg-gray-800 rounded-2xl flex items-center justify-center">
          <p className="text-gray-400 text-sm">No QR code yet</p>
        </div>
      )}
      <p className="text-white font-black text-xl sm:text-2xl mt-6 text-center">{student.full_name}</p>
      <p className="text-gray-400 text-sm mt-1">{student.student_id}</p>
      <p className="text-gray-600 text-xs mt-10">Tap anywhere to close</p>
    </div>,
    document.body
  );
  

const PHOTO_STATUS = {
  PROCESSED:     { text: '✅ Processed',    cls: 'bg-green-100 text-green-700' },
  MANUAL_REVIEW: { text: '⚠ Needs Review', cls: 'bg-amber-100 text-amber-700' },
  PENDING:       { text: '○ Pending',       cls: 'bg-gray-100 text-gray-500'  },
};

// ── Main Component ────────────────────────────────────────────────────────────
const CoordinatorDashboard = () => {
  const { user, logout } = useAuth();
  const { clearOrders }  = useOrders();

  // Orders
  const [orders,        setOrders]        = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');

  // Student list
  const [students,      setStudents]      = useState<any[]>([]);
  const [loadingList,   setLoadingList]   = useState(false);

  // Search
  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState<any[]>([]);
  const [searching,     setSearching]     = useState(false);

  // Walk-in
  const [walkinName,    setWalkinName]    = useState('');
  const [walkinGrade,   setWalkinGrade]   = useState('');
  const [adding,        setAdding]        = useState(false);

  // QR display
  const [qrStudent,     setQrStudent]     = useState<any | null>(null);

  // Active tab
  const [tab, setTab] = useState<'list' | 'search' | 'walkin' | 'proof'>('list');
  const [proofingOrders,  setProofingOrders]  = useState<any[]>([]);
  const [proofingOrderId, setProofingOrderId] = useState<number | null>(null);

  // ── Fetch student list ──────────────────────────────────────────────────────
  const fetchStudentList = useCallback(async (orderId: string) => {
    if (!orderId) return;
    setLoadingList(true);
    try {
      const res = await api.get(`/coordinator/orders/${orderId}/students/`);
      setStudents(res.data);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Load orders on mount
  useEffect(() => {
    api.get('/coordinator/orders/')
      .then(res => {
        setOrders(res.data);
        if (res.data.length > 0) {
          const firstId = String(res.data[0].id);
          setSelectedOrder(firstId);
        }
      })
      .catch(() => toast.error('Failed to load orders'));
  }, []);

    useEffect(() => {
  if (tab !== 'proof') return;
  api.get('/coordinator/proofing-orders/')
    .then(res => setProofingOrders(res.data))
    .catch(() => {});
    }, [tab]);

  // Fetch student list when order changes
  useEffect(() => {
    if (selectedOrder) fetchStudentList(selectedOrder);
  }, [selectedOrder, fetchStudentList]);

  // Poll every 10s for real-time updates
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(() => fetchStudentList(selectedOrder), 10000);
    return () => clearInterval(interval);
  }, [selectedOrder, fetchStudentList]);

  // ── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/coordinator/students/search/?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // ── Walk-in ─────────────────────────────────────────────────────────────────
  const handleAddWalkin = async () => {
    if (!walkinName.trim() || !selectedOrder) return;
    setAdding(true);
    try {
      const res = await api.post(`/orders/${selectedOrder}/students/quick-add/`, {
        full_name:   walkinName.trim(),
        grade_level: walkinGrade.trim(),
      });
      toast.success(`${res.data.full_name} added`);
      setQrStudent(res.data);
      setWalkinName('');
      setWalkinGrade('');
      fetchStudentList(selectedOrder); // refresh list immediately
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };



  // ── Mark photographed ───────────────────────────────────────────────────────
  const handleMarkPhotographed = async (studentId: number) => {
    try {
      const res = await api.post(`/coordinator/students/${studentId}/mark-photographed/`);
      // Optimistic update
      setStudents(prev =>
        prev.map(s => s.id === studentId ? { ...s, is_photographed: res.data.is_photographed } : s)
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const photographed = students.filter(s => s.is_photographed).length;
  const total        = students.length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {qrStudent && <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />}
      {proofingOrderId && (
            <ProofingModal
                orderId={proofingOrderId}
                order={proofingOrders.find(o => o.id === proofingOrderId)!}
                onClose={() => setProofingOrderId(null)}
                onApproved={(id) => {
                setProofingOrders(prev => prev.filter(o => o.id !== id));
                setProofingOrderId(null);
                toast.success('Order approved');
                }}
            />
        )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <header className="flex justify-between items-start sm:items-center mb-5 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Coordinator Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome, {user?.username}</p>
          </div>
          <button
            onClick={() => logout(clearOrders)}
            className="text-sm font-bold text-red-600 py-2 px-1 shrink-0 hover:underline"
          >
            Logout
          </button>
        </header>

        {/* Order selector */}
        {orders.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedOrder}
              onChange={e => setSelectedOrder(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-3 sm:py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.school_name} — {o.batch_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-600 uppercase tracking-wide">Photo Day Progress</span>
              <span className="text-xs font-bold text-gray-900">{photographed} / {total} photographed</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(photographed / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
          {([
            { key: 'list',   label: '👥 Students' },
            { key: 'search', label: '🔍 Search'   },
            { key: 'walkin', label: '➕ Walk-in'  },
            { key: 'proof',  label: '🪪 Proof IDs'},
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Student List Tab ── */}
        {tab === 'list' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingList ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No students in this order.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map(s => {
                  const statusCfg = PHOTO_STATUS[s.photo_status as keyof typeof PHOTO_STATUS] ?? PHOTO_STATUS.PENDING;
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">

                      {/* Photographed toggle */}
                      <button
                        onClick={() => handleMarkPhotographed(s.id)}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                          s.is_photographed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={s.is_photographed ? 'Mark as not photographed' : 'Mark as photographed'}
                      >
                        {s.is_photographed ? '✓' : '○'}
                      </button>

                      {/* Student info */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${s.is_photographed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {s.full_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.student_id} · Gr. {s.grade_level}
                          {s.is_walk_in && <span className="ml-1 text-indigo-500 font-bold">· Walk-in</span>}
                        </p>
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
                          {statusCfg.text}
                        </span>
                        {s.qr_code_url && (
                          <button
                            onClick={() => setQrStudent(s)}
                            className="text-xs font-bold text-indigo-600 py-0.5 px-2 rounded hover:bg-indigo-50 transition-colors"
                          >
                            QR
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Search Tab ── */}
        {tab === 'search' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or student ID..."
              className="w-full border border-gray-200 rounded-lg px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            {searching && <p className="text-xs text-gray-400 mt-2">Searching...</p>}
            {results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map(s => {
                  const statusCfg = PHOTO_STATUS[s.photo_status as keyof typeof PHOTO_STATUS] ?? PHOTO_STATUS.PENDING;
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.full_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.student_id} · Gr. {s.grade_level}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {s['order__school_name']} — {s['order__batch_name']}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
                          {statusCfg.text}
                        </span>
                        {s.qr_code_url && (
                          <button
                            onClick={() => setQrStudent(s)}
                            className="text-xs font-bold text-indigo-600 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            Show QR
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">No students found.</p>
            )}
          </section>
        )}

        {/* ── Walk-in Tab ── */}
        {tab === 'walkin' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Student Name *</label>
                  <input
                    value={walkinName}
                    onChange={e => setWalkinName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Grade Level</label>
                  <input
                    value={walkinGrade}
                    onChange={e => setWalkinGrade(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <button
                onClick={handleAddWalkin}
                disabled={adding || !walkinName.trim() || !selectedOrder}
                className="w-full py-3.5 sm:py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors active:scale-95"
              >
                {adding ? 'Adding...' : 'Add Walk-in Student'}
              </button>
            </div>
          </section>
        )}

        {tab === 'proof' && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {proofingOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                    No orders are currently waiting for ID review.
                </div>
                ) : (
                <div className="divide-y divide-gray-50">
                    {proofingOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{order.school_name}</p>
                        <p className="text-xs text-gray-400">{order.batch_name} · {order.student_count} students</p>
                        </div>
                        <button
                        onClick={() => setProofingOrderId(order.id)}
                        className="shrink-0 px-3 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors active:scale-95"
                        >
                        Review IDs
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </section>
            )}

      </div>
    </div>
  );
};

export default CoordinatorDashboard;