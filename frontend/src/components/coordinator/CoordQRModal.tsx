import { X, QrCode } from 'lucide-react'
import { getInitials, getHue } from './coordinatorTypes'

interface QRStudent {
    id: number
    full_name: string
    student_id: string
    grade_level: string
    qr_code_url?: string
}

interface CoordQRModalProps {
    student: QRStudent
    onClose: () => void
}

function Avatar({ name, id, size = 36 }: { name: string; id: number; size?: number }) {
    const hue = getHue(id)
    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.33,
                background: `hsl(${hue}, 55%, 48%)`,
            }}>
            {getInitials(name)}
        </div>
    )
}

export default function CoordQRModal({ student, onClose }: CoordQRModalProps) {
    const hue = getHue(student.id)
    const borderColor = `hsl(${hue}, 55%, 48%)`

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(15,23,42,0.5)] backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative bg-white w-full sm:w-[360px] sm:rounded-2xl rounded-t-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#e8eeff] flex items-center justify-center">
                            <QrCode size={14} className="text-[#004ac6]" />
                        </div>
                        <h3 className="text-[15px] font-bold text-[#0b1c30]">Student QR Code</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                        <X size={16} className="text-[#64748b]" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-5 px-6 py-7">
                    {/* Student info strip */}
                    <div className="flex items-center gap-3 self-start w-full bg-[#f8fafc] rounded-xl px-4 py-3 border border-[#f1f5f9]">
                        <Avatar name={student.full_name} id={student.id} size={44} />
                        <div>
                            <div className="text-[15px] font-bold text-[#0b1c30]">{student.full_name}</div>
                            <div className="text-[12px] text-[#9ba3af]">{student.student_id} · {student.grade_level}</div>
                        </div>
                    </div>

                    {/* QR code */}
                    <div
                        className="bg-white rounded-2xl border-[3px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center"
                        style={{ borderColor }}>
                        {student.qr_code_url ? (
                            <img
                                src={student.qr_code_url}
                                alt={`QR code for ${student.full_name}`}
                                className="w-[180px] h-[180px] object-contain"
                            />
                        ) : (
                            <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
                                <QrCode size={48} className="text-[#c8cbd9]" />
                                <p className="text-[12px] text-[#9ba3af] text-center">QR code not yet generated</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[13px] font-semibold text-[#374151]">Show this screen to the photographer</p>
                        <p className="text-[12px] text-[#9ba3af]">Scan QR to auto-attach student record</p>
                    </div>

                    <button onClick={onClose}
                        className="w-full py-3 rounded-xl bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}
