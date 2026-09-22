import { useState } from "react";
import { FileImage } from "lucide-react";

interface MiniCardProps {
    processedPhoto?: string | null; 
    fullName?: string; 
    hue?: number;
}

export function MiniCard({ processedPhoto, fullName, hue = 210 }: MiniCardProps) {
    const [error, setError] = useState(false);

    if (processedPhoto && !error) {
        return (
            <div className="w-[64px] h-[40px] rounded overflow-hidden border border-gray-200 shadow-sm bg-gray-50 shrink-0 group relative">
                <img
                src={processedPhoto}
                alt={fullName ? `${fullName}'s ID Card` : "ID Card Preview"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={() => setError(true)}
                />
            </div>
        )
    }
    return (
        <div
            className="relative bg-white rounded overflow-hidden border border-gray-200 shadow-sm shrink-0"
            style={{ width: 64, height: 40 }}
            title={error ? "Failed to load ID preview" : "CSS Preview"}
        >
            <div
                className="absolute top-0 left-0 right-0 h-[22%]"
                style={{ background: `linear-gradient(90deg, hsl(${hue},55%,45%), hsl(${hue},60%,35%))` }}
            />
            <div className="absolute rounded overflow-hidden" style={{ left: "6%", top: "28%", width: "20%", height: "58%" }}>
                <div
                className="w-full h-full"
                style={{ background: `linear-gradient(135deg, hsl(${hue},45%,55%), hsl(${hue},50%,40%))` }}
                />
                <svg viewBox="0 0 40 50" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 opacity-25" fill="white">
                <circle cx="20" cy="13" r="10" />
                <ellipse cx="20" cy="44" rx="16" ry="14" />
                </svg>
            </div>
            <div className="absolute rounded" style={{ left: "31%", top: "30%", right: "5%", height: "14%", background: `hsl(${hue},30%,92%)` }} />
            <div className="absolute rounded" style={{ left: "31%", top: "50%", width: "35%", height: "10%", background: `hsl(${hue},20%,93%)` }} />
        </div>
  );
}