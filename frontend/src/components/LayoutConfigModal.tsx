import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import api from '../utils/api';

interface LayoutConfigModalProps {
  orderId: number;
  onClose: () => void;
}

const LayoutConfigModal: React.FC<LayoutConfigModalProps> = ({ orderId, onClose }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const photoRef = useRef(null);
  const nameRef = useRef(null);
  const sectionRef = useRef(null);
  const qrRef = useRef(null);
  const barcodeRef = useRef(null);

  const [elements, setElements] = useState({
    photo: { x: 50, y: 50, w: 150, h: 200 },
    name: { x: 50, y: 270 },
    section: { x: 50, y: 300 },
    qr: { x: 280, y: 480, size: 80 },
    barcode: { x: 50, y: 500, w: 200, h: 50 }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgFile(file);
      setBgImage(URL.createObjectURL(file));
    }
  };

  const saveLayout = async () => {
    if (!bgFile) return alert("Please upload a background template first.");
    setLoading(true);
    const formData = new FormData();
    formData.append('background_image', bgFile);
    formData.append('photo_x', Math.round(elements.photo.x).toString());
    formData.append('photo_y', Math.round(elements.photo.y).toString());
    formData.append('photo_width', Math.round(elements.photo.w).toString());
    formData.append('photo_height', Math.round(elements.photo.h).toString());
    formData.append('fields_config', JSON.stringify({
      name_pos: elements.name,
      section_pos: elements.section,
      qr_pos: elements.qr,
      barcode_pos: elements.barcode
    }));

    try {
      await api.post(`/orders/${orderId}/layout/`, formData);
      alert("Layout Saved!");
      onClose();
    } catch (err: any) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden">
      {/* 1. Full-Width Header */}
      <header className="h-16 border-b bg-gray-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="hover:text-gray-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-black tracking-tighter uppercase">Template Studio <span className="text-indigo-400">/ Order #{orderId}</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-400 mr-4">Auto-snap enabled</span>
          <button 
            disabled={loading}
            onClick={saveLayout}
            className={`px-8 py-2 rounded-md font-bold text-sm transition-all active:scale-95 ${
                loading ? 'bg-gray-700 text-gray-500' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
            }`}
          >
            {loading ? "Publishing..." : "Publish Template"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Sleek Fixed Sidebar */}
        <aside className="w-72 border-r bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Base Asset</h3>
              <div className="relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="text-xs font-bold text-center text-gray-500 group-hover:text-indigo-600">
                  {bgFile ? bgFile.name : "Replace Background"}
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions Control</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-500">Photo Width</span>
                  <span className="text-indigo-600">{elements.photo.w}px</span>
                </div>
                <input type="range" min="50" max="350" value={elements.photo.w} onChange={(e) => setElements({...elements, photo: {...elements.photo, w: +e.target.value}})} className="w-full accent-indigo-600" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-500">Photo Height</span>
                  <span className="text-indigo-600">{elements.photo.h}px</span>
                </div>
                <input type="range" min="50" max="450" value={elements.photo.h} onChange={(e) => setElements({...elements, photo: {...elements.photo, h: +e.target.value}})} className="w-full accent-indigo-600" />
              </div>
            </section>

            <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Live Coordinates</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-600">
                    <p>X: {elements.photo.x}</p>
                    <p>Y: {elements.photo.y}</p>
                </div>
            </section>
          </div>
        </aside>

        {/* 3. The "Infinite" Workspace */}
        <main className="flex-1 bg-gray-100 relative overflow-auto flex items-start justify-center p-20 custom-scrollbar">
          <div 
            className="relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-300 transition-all"
            style={{ 
              width: '400px', 
              height: '600px', 
              backgroundImage: bgImage ? `url(${bgImage})` : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            {!bgImage && <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold uppercase tracking-tighter">No Background Uploaded</div>}

            {/* Photo Box */}
            <Draggable nodeRef={photoRef} bounds="parent" position={{x: elements.photo.x, y: elements.photo.y}} onStop={(e, d) => setElements({...elements, photo: {...elements.photo, x: d.x, y: d.y}})}>
              <div ref={photoRef} className="absolute cursor-move border-2 border-indigo-500 bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-700 z-50 backdrop-blur-[2px]" style={{width: elements.photo.w, height: elements.photo.h}}>
                FACE_CROPLINE
              </div>
            </Draggable>

            {/* Name */}
            <Draggable nodeRef={nameRef} bounds="parent" position={{x: elements.name.x, y: elements.name.y}} onStop={(e, d) => setElements({...elements, name: {x: d.x, y: d.y}})}>
              <div ref={nameRef} className="absolute cursor-move px-3 py-1 bg-white border-2 border-indigo-500 text-xs font-black uppercase tracking-tight text-gray-900 shadow-sm">
                Student Name
              </div>
            </Draggable>

            {/* Section */}
            <Draggable nodeRef={sectionRef} bounds="parent" position={{x: elements.section.x, y: elements.section.y}} onStop={(e, d) => setElements({...elements, section: {x: d.x, y: d.y}})}>
              <div ref={sectionRef} className="absolute cursor-move px-3 py-1 bg-white border border-gray-800 text-[10px] font-bold text-gray-800 shadow-sm">
                Grade / Section
              </div>
            </Draggable>

            {/* QR */}
            <Draggable nodeRef={qrRef} bounds="parent" position={{x: elements.qr.x, y: elements.qr.y}} onStop={(e, d) => setElements({...elements, qr: {...elements.qr, x: d.x, y: d.y}})}>
              <div ref={qrRef} className="absolute cursor-move bg-black flex items-center justify-center text-white text-[7px] p-2" style={{width: elements.qr.size, height: elements.qr.size}}>
                QR_ENTITY
              </div>
            </Draggable>

            {/* Barcode */}
            <Draggable nodeRef={barcodeRef} bounds="parent" position={{x: elements.barcode.x, y: elements.barcode.y}} onStop={(e, d) => setElements({...elements, barcode: {...elements.barcode, x: d.x, y: d.y}})}>
              <div ref={barcodeRef} className="absolute cursor-move bg-white border-2 border-black flex items-center justify-center text-[9px] font-mono tracking-widest" style={{width: elements.barcode.w, height: elements.barcode.h}}>
                |||| ID_BARCODE ||||
              </div>
            </Draggable>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutConfigModal;