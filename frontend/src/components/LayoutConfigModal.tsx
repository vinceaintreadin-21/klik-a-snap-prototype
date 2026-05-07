import React, { useState } from 'react';
import api from '../utils/api';

interface LayoutConfigModalProps {
  orderId: number;
  onClose: () => void;
}

const LayoutConfigModal: React.FC<LayoutConfigModalProps> = ({ orderId, onClose }) => {
  const [bgImage, setBgImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for coordinates (Matching your Django Layout model)
  const [coords, setCoords] = useState({
    photo_x: 169,
    photo_y: 180,
    photo_width: 300,
    photo_height: 350,
    card_width: 638,
    card_height: 1012,
  });

  const handleSaveLayout = async () => {
    if (!bgImage) return alert("Please upload a background image first.");

    const formData = new FormData();
    formData.append('background_image', bgImage);
    
    // Add coordinate fields
    Object.entries(coords).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Add a default config for specific text placements
    formData.append('fields_config', JSON.stringify({
      name_font_size: 24,
      id_font_size: 18,
      text_color: "#000000"
    }));

    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/layout/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Layout saved! The AI is now ready to use these settings.");
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error saving layout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-900">ID Canvas Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Background Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">ID Template Background</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-all">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setBgImage(e.target.files?.[0] || null)}
                className="mb-2 text-sm block w-full"
              />
              <p className="text-xs text-gray-400">Upload the empty ID design (PNG/JPG)</p>
            </div>
            {bgImage && <p className="text-xs text-green-600 font-bold">✓ {bgImage.name} selected</p>}
          </div>

          {/* Section 2: Coordinate Inputs */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Photo Positioning (Pixels)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">X Position</label>
                <input type="number" value={coords.photo_x} onChange={(e) => setCoords({...coords, photo_x: +e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Y Position</label>
                <input type="number" value={coords.photo_y} onChange={(e) => setCoords({...coords, photo_y: +e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Width</label>
                <input type="number" value={coords.photo_width} onChange={(e) => setCoords({...coords, photo_width: +e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Height</label>
                <input type="number" value={coords.photo_height} onChange={(e) => setCoords({...coords, photo_height: +e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
          <button 
            disabled={loading}
            onClick={handleSaveLayout}
            className={`px-8 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutConfigModal;