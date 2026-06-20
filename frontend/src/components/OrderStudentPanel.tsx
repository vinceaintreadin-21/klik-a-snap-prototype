import { useState, useEffect, useRef } from "react";
import api from "../utils/api";

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  grade_level: string;
  photo_status: 'PENDING' | 'PROCESSED' | 'MANUAL_REVIEW';
  is_approved: boolean;
  fail_reason: string | null;
  processed_photo_url: string | null;
}


const PHOTO_STATUS_CONFIG = {
    PENDING: { label: '○ Pending', classes: 'bg-gray-100 text-gray-500' },
    PROCESSED: { label: '✅ Processed', classes: 'bg-green-100 text-green-700'},
    MANUAL_REVIEW: { label: '⚠ Review', classes: 'bg-amber-100 text-amber-700' },
};

const PAGE_SIZE = 50;

interface OrderStudentPanelProps {
  orderId: number;
  isOpen: boolean;
}

const OrderStudentPanel = ({isOpen, orderId}: OrderStudentPanelProps) => {
    const [students, setStudents] = useState<Student[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const hasFetched = useRef(false)

    useEffect(() => {
        if (!isOpen || hasFetched.current) return;
        hasFetched.current = true;
        setLoading(true);
        api.get(`/orders/${orderId}/students/`)
        .then(res => setStudents(res.data))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    }, [isOpen, orderId]);

    if (!isOpen) return null;

    if (loading) {
        return (
          <div className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
            Loading students...
          </div>
        );
    }

    if (!students || students.length === 0) {
       return (
         <div className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
           No students found.
         </div>
       );
    }

    const totalPages  = Math.ceil(students.length / PAGE_SIZE);
    const paginated   = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const startIndex  = (page - 1) * PAGE_SIZE;

    return (
        <div className="border-t border-gray-100">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase w-10">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Grade</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-center">✓</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {paginated.map((student, i) => {
                    const statusCfg = PHOTO_STATUS_CONFIG[student.photo_status] ?? PHOTO_STATUS_CONFIG.PENDING;
                    return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-400">{startIndex + i + 1}</td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{student.full_name}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{student.student_id}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{student.grade_level}</td>
                        <td className="px-4 py-2.5">
                        <span
                            title={student.photo_status === 'MANUAL_REVIEW' ? (student.fail_reason ?? '') : ''}
                            className={`text-xs font-bold px-2 py-0.5 rounded-full cursor-default ${statusCfg.classes}`}
                        >
                            {statusCfg.label}
                        </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">
                        {student.is_approved
                            ? <span className="text-green-500 font-bold">✓</span>
                            : <span className="text-gray-300">—</span>
                        }
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                    Showing {startIndex + 1}–{Math.min(page * PAGE_SIZE, students.length)} of {students.length}
                </p>
                <div className="flex items-center gap-1">
                    <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    >
                    ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        p === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        {p}
                    </button>
                    ))}
                    <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    >
                    →
                    </button>
                </div>
            </div>
        )}
        </div>
    )
}

export default OrderStudentPanel