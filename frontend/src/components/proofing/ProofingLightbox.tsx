import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ProofingLightboxProps {
    url: string | null;
    onClose: () => void;
}

const ProofingLightbox = ({ url, onClose }: ProofingLightboxProps) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {if (e.key === 'Escape') onClose();};
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);

    }, [onClose])

    if (!url) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center cursor-zoom-out"
            onClick={onClose}
        >
            <img 
                src={url} 
                alt="ID Card Preview"
                className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
            >
                x
            </button>

        </div>,
        document.body
    )
}

export default ProofingLightbox
