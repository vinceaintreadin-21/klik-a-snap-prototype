import { useAuditLogs } from "../../hooks/useLogs";

export const AuditLogs = () => {
    const { data, loading, error } = useAuditLogs()

    if (loading) return <p className="text-sm text-gray-500">Loading audit logs...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Audit Logs</h3>
            {!data.length ? (
                <p className="text-sm text-gray-400">No audit logs found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                                <th className="pb-2 pr-4">Admin</th>
                                <th className="pb-2 pr-4">Action</th>
                                <th className="pb-2 pr-4">Target Model</th>
                                <th className="pb-2 pr-4">Target ID</th>
                                <th className="pb-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(log => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2 pr-4 text-gray-600">{log.admin_user ?? '—'}</td>
                                    <td className="py-2 pr-4">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">{log.target_model}</td>
                                    <td className="py-2 pr-4 text-gray-500">{log.target_id}</td>
                                    <td className="py-2 text-gray-400">{new Date(log.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}