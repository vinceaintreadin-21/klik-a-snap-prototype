import { useState } from 'react'
import { Link2, X, Info, Check, Copy, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'

interface GenerateCoordinatorModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function GenerateCoordinatorModal({ onClose, onSuccess }: GenerateCoordinatorModalProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [expiry, setExpiry] = useState<'24h' | '48h' | '7d'>('48h')
    const [generated, setGenerated] = useState(false)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedLink, setGeneratedLink] = useState('')

    const expiryHours = { '24h': 24, '48h': 48, '7d': 168 }

    const handleGenerate = async () => {
        if (!name.trim() || !email.trim()) return
        setLoading(true)
        setError(null)
        try {
            const res = await api.post('/institution/coordinators/invite/', {
                name: name.trim(),
                email: email.trim(),
                expires_in_hours: expiryHours[expiry],
            })
            setGeneratedLink(res.data?.invite_url ?? `${window.location.origin}/coordinator/join/${res.data?.token}`)
            setGenerated(true)
            onSuccess()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate coordinator link.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(15,23,42,0.35)] backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-[480px] overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-[#f1f5f9]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#e8eeff] flex items-center justify-center">
                            <Link2 size={18} className="text-[#004ac6]" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-[#0b1c30]">Generate New Coordinator</h2>
                            <p className="text-[12px] text-[#9ba3af] mt-0.5">Create a mobile photo capture link</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                        <X size={16} className="text-[#64748b]" />
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    {!generated ? (
                        <>
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Smith"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="e.g. j.smith@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors"
                                />
                            </div>

                            {/* Link expiry */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Link Expiry</label>
                                <div className="flex gap-2">
                                    {(['24h', '48h', '7d'] as const).map((opt) => (
                                        <button key={opt} onClick={() => setExpiry(opt)}
                                            className={cn(
                                                'flex-1 py-2 rounded-lg border text-[13px] font-medium transition-all',
                                                expiry === opt
                                                    ? 'bg-[#004ac6] text-white border-[#004ac6]'
                                                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#004ac6] hover:text-[#004ac6]'
                                            )}>
                                            {opt === '24h' ? '24 Hours' : opt === '48h' ? '48 Hours' : '7 Days'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg px-3.5 py-3">
                                <Info size={14} className="text-[#0284c7] mt-0.5 shrink-0" />
                                <p className="text-[12px] text-[#0369a1] leading-4">
                                    The coordinator will receive an email with a secure mobile link to capture student photos. The link expires after the selected period.
                                </p>
                            </div>

                            {error && (
                                <p className="text-[12px] text-[#b91c1c] bg-[#fff5f5] border border-[#fca5a5] rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-1">
                                <button onClick={onClose}
                                    className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!name.trim() || !email.trim() || loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#004ac6] text-white text-[13px] font-medium hover:bg-[#003da6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                    <Link2 size={14} />
                                    {loading ? 'Generating…' : 'Generate Link'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-3 py-2">
                                <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] flex items-center justify-center">
                                    <CheckCircle2 size={28} className="text-[#22c55e]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[15px] font-bold text-[#0b1c30]">Link Generated!</p>
                                    <p className="text-[13px] text-[#64748b] mt-1">An invitation has been sent to <strong>{email}</strong></p>
                                </div>
                            </div>

                            {generatedLink && (
                                <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2.5">
                                    <Link2 size={14} className="text-[#9ba3af] shrink-0" />
                                    <span className="flex-1 text-[12px] font-mono text-[#64748b] truncate">{generatedLink}</span>
                                    <button onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#e2e8f0] text-[12px] text-[#374151] hover:border-[#004ac6] transition-colors shrink-0">
                                        {copied ? <><Check size={12} className="text-[#22c55e]" /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                                <div className="w-9 h-9 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-[#0b1c30] truncate">{name}</div>
                                    <div className="text-[11px] text-[#9ba3af] truncate">{email}</div>
                                </div>
                                <span className="text-[11px] font-medium text-[#1d4ed8] bg-[#eff6ff] px-2 py-0.5 rounded-full shrink-0">
                                    Expires {expiry === '24h' ? 'in 24h' : expiry === '48h' ? 'in 48h' : 'in 7 days'}
                                </span>
                            </div>

                            <button onClick={onClose}
                                className="w-full py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors font-medium">
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
