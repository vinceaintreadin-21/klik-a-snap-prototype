import { cn } from "../../lib/utils";
import { STAGE_KEYS, STATUS_CONFIG } from "./StatusConfig";
import type { OperatorOrderStatus } from "./proofingTypes";

interface StageBarProps {
    status: OperatorOrderStatus;
}

export default function StageBar({ status }: StageBarProps) {
    const idx = STAGE_KEYS.indexOf(status);
    return (
        <div className="mt-3">
            <div className="flex items-center gap-1.5">
                {STAGE_KEYS.map((stage, i) => (
                    <div
                        key={stage}
                        className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= idx ? "bg-blue-500" : "bg-gray-200")}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between mt-1.5">
                {STAGE_KEYS.map((stage, i) => (
                    <span key={stage} className={cn("text-[10px] font-medium", i <= idx ? "text-blue-600" : "text-gray-400")}>
                        {STATUS_CONFIG[stage].label}
                    </span>
                ))}
            </div>
        </div>
    );
}
