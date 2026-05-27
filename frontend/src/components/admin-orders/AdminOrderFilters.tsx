import type { OrderFilters } from "../../hooks/useAdminOrders"
import { useInstitutions } from "../../hooks/useInstitutions"

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'PROOFING', 'APPROVED', 'PRINTING', 'COMPLETED', 'CANCELLED']

interface Props {
    filters: OrderFilters
    onChange: (filters: OrderFilters) => void
}

const AdminOrderFilters = ({ filters, onChange }: Props) => {
    const { institutions } = useInstitutions()

    const handle = (key: keyof OrderFilters, value: string) => {
        onChange({ ...filters, [key]: value || undefined })
    }

    return (
        <div className="flex flex-wrap gap-3 mb-4">
            <select
                value={filters.status ?? ''}
                onChange={e => handle('status', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            <select
                value={filters.institution_id ?? ''}
                onChange={e => handle('institution_id', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Institutions</option>
                {institutions.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                ))}
            </select>

            <input
                type="date"
                value={filters.date_from ?? ''}
                onChange={e => handle('date_from', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="date"
                value={filters.date_to ?? ''}
                onChange={e => handle('date_to', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    )
}

export default AdminOrderFilters