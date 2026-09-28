import { useState } from "react";
import ProofingStudentCard from "./ProofingStudentCard";
import type { ProofStudent } from "./ProofingStudentCard";

const PAGE_SIZE = 50;

interface ProofingGridProps {
    students: ProofStudent[];
    localApproved: Set<number>;
    localRevision: Set<number>;
    onApprove: (id: number) => void;
    onRevision: (id: number, reason: string) => void;
    onImageClick: (url: string) => void;
}

const ProofingGrid = ({
  students,
  localApproved,
  localRevision,
  onApprove,
  onRevision,
  onImageClick,
}: ProofingGridProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = students.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {paginated.map(student => (
            <ProofingStudentCard
              key={student.id}
              student={student}
              localApproved={localApproved.has(student.id)}
              localRevision={localRevision.has(student.id)}
              onApprove={onApprove}
              onRevision={onRevision}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 text-xs text-gray-500 shrink-0">
          <span>
            Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, students.length)} of {students.length}
          </span>
          <div className="flex items-center gap-1">
            <button 
                onClick={() => setPage(1)} 
                disabled={safePage === 1} 
                className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
                «
            </button>
            <button 
                onClick={() => setPage(p => p - 1)} 
                disabled={safePage === 1} 
                className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
                ‹
            </button>
            <span className="px-3">Page {safePage} of {totalPages}</span>
            <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={safePage === totalPages} 
                className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
                ›
            </button>
            <button 
                onClick={() => setPage(totalPages)}    
                disabled={safePage === totalPages} 
                className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
                »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofingGrid;