import ProcessingLogs from "../components/admin-logs/ProcessingLogs";
import ErrorLogs from "../components/admin-logs/ErrorLogs";
import { AuditLogs } from "../components/admin-logs/AuditLogs";

const Logs = () => {
    return (
        <div className="space-y-6 p-6">
            <ErrorLogs />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProcessingLogs />
                <AuditLogs />
            </div>
        </div>
    )
}

export default Logs