import { useErrorLogs } from "../../hooks/useLogs";

const ErrorLogs = () => {
    const { data, errorCount, loading, error } = useErrorLogs()

    if (loading) return <p className="text-sm text-gray-500">Loading error logs...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Error Logs</h3>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {errorCount} errors
                </span>
            </div>
            {!data.length ? (
                <p className="text-sm text-gray-400">No error logs found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                                <th className="pb-2 pr-4">Order</th>
                                <th className="pb-2 pr-4">Level</th>
                                <th className="pb-2 pr-4">Message</th>
                                <th className="pb-2 pr-4">Created By</th>
                                <th className="pb-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(log => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2 pr-4 text-gray-600">{log.order_name}</td>
                                    <td className="py-2 pr-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            log.level === 'CRITICAL' ? 'bg-red-200 text-red-700' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">{log.message}</td>
                                    <td className="py-2 pr-4 text-gray-500">{log.created_by ?? '—'}</td>
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

export default ErrorLogs

