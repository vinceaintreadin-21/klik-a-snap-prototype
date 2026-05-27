import { useManualReviewRate } from "../../hooks/useAnalytics";

const ManualReviewRate = () => {
    const { data, loading, error } = useManualReviewRate()

    if (loading) return <p className="text-sm text-gray-500">Loading review...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>
    if (!data) return null 

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Review</h3>
            <div className="flex items-end gap-2 mb-3">
                <p className="text-3xl font-semibold text-gray-800">{data.rate}%</p>
                <p className="text-sm text-gray-400 mb-1">of students flagged</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.rate}%`}}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{data.manual_review_count} flagged</span>
                <span>{data.total_students} total</span>
            </div>
        </div>
    )
}

export default ManualReviewRate