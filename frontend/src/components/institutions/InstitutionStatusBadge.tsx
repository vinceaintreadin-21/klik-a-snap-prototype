interface Props {
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

const statusConfig = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 border border-green-280' },
    INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
    SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700 border border-red-200' }
}

const InstitutionStatusBadge = ({ status }: Props) => {
    const config = statusConfig[status] ?? statusConfig.INACTIVE

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    )
}

export default InstitutionStatusBadge