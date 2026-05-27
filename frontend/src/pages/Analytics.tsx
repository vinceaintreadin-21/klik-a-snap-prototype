import AnalyticsOverview from "../components/analytics/AnalyticsOverview";
import OrdersPerMonth from "../components/analytics/OrdersPerMonth";
import ManualReviewRate from "../components/analytics/ManualReviewRate";

const Analytics = () => {

    return (
        <div className="space-y-6 p-6">
            <AnalyticsOverview />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OrdersPerMonth />
                <ManualReviewRate />
            </div>
        </div>
    )

}

export default Analytics