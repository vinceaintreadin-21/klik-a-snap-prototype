import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import api from '../utils/api';

type ElementKey = 'photo' | 'name' | 'section' | 'qr' | 'barcode';

const LayoutConfigModal = ({ orderId, onClose }: { orderId: number, onClose: () => void }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementKey>('photo');

  //state for card dimensions
  const [cardWidth, setCardWidth] = useState(638);
  const [cardHeight, setCardHeight] = useState(1012);
  const [zoom, setZoom] = useState(1)

  const prevWidth = cardWidth * zoom;
  const prevHeight = cardHeight * zoom;

  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (dimension === 'width') {
      setCardWidth(value);  
    } else {
      setCardHeight(value)
    }
  }

  const presets = [
    { label: 'Standard (638x1012)', width: 638, height: 1012 },
    { label: 'Compact (600x900)', width: 600, height: 900 },
    { label: 'Wide (800x1000)', width: 800, height: 1000 },
  ]

  const refs: Record<ElementKey, React.RefObject<any>> = {
    photo: useRef(null), name: useRef(null), section: useRef(null),
    qr: useRef(null), barcode: useRef(null),
  };

  const [elements, setElements] = useState({
    photo: { x: 50, y: 50, w: 150, h: 200 },
    name: { x: 50, y: 270, w: 180, h: 30, fontSize: 28, color: '#000000' },
    section: { x: 50, y: 310, w: 120, h: 25, fontSize: 20, color: '#333333' },
    qr: { x: 280, y: 480, w: 80, h: 80 },
    barcode: { x: 50, y: 500, w: 200, h: 50 }
  });

  const updateProp = (prop: string, value: any) => {
    setElements(prev => ({ ...prev, [selectedElement]: { ...prev[selectedElement], [prop]: value } }));
  };

  const saveLayout = async () => {
    if (!bgFile) return alert("Upload background first.");
    setLoading(true);
    
    const formData = new FormData();
    formData.append('background_image', bgFile);
    formData.append('card_width', cardWidth.toString())
    formData.append('card_height', cardHeight.toString())
    
    // Bridging React state to Python expected keys
    const configForPython = {
      full_name: { 
        x: Math.round(elements.name.x), y: Math.round(elements.name.y), 
        font_size: elements.name.fontSize, color: elements.name.color 
      },
      grade_level: { 
        x: Math.round(elements.section.x), y: Math.round(elements.section.y), 
        font_size: elements.section.fontSize, color: elements.section.color 
      },
      qr_code: { x: Math.round(elements.qr.x), y: Math.round(elements.qr.y), size: elements.qr.w },
      barcode: { 
        x: Math.round(elements.barcode.x), y: Math.round(elements.barcode.y), 
        width: elements.barcode.w, height: elements.barcode.h 
      }
    };

    formData.append('photo_x', Math.round(elements.photo.x).toString());
    formData.append('photo_y', Math.round(elements.photo.y).toString());
    formData.append('photo_width', Math.round(elements.photo.w).toString());
    formData.append('photo_height', Math.round(elements.photo.h).toString());
    formData.append('fields_config', JSON.stringify(configForPython));

    try {
      await api.post(`/orders/${orderId}/layout/create/`, formData);
      alert("Template Published!");
      onClose();
    } catch (err) { alert("Save failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden font-sans text-gray-900">
      <header className="h-16 border-b bg-gray-900 text-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose}>✕</button>
          <h1 className="text-lg font-black uppercase">Designer / Order #{orderId}</h1>
        </div>
        <button onClick={saveLayout} disabled={loading} className="bg-indigo-500 px-8 py-2 rounded font-bold">
          {loading ? "Saving..." : "Publish Template"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r bg-gray-50 p-6 flex flex-col gap-6 overflow-y-scroll">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">1. Background</h3>
            <input type="file" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setBgFile(file); setBgImage(URL.createObjectURL(file)); }
            }} className="text-xs w-full" />
          </div>

          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">2. Inspector: {selectedElement}</h3>
            <div className="space-y-4">
                <label className="text-xs font-bold block">Width ({elements[selectedElement].w}px)</label>
                <input type="range" min="10" max="400" value={elements[selectedElement].w} onChange={(e) => updateProp('w', +e.target.value)} className="w-full" />
                
                {selectedElement !== 'qr' && (
                  <>
                    <label className="text-xs font-bold block">Height ({elements[selectedElement].h}px)</label>
                    <input type="range" min="10" max="500" value={elements[selectedElement].h} onChange={(e) => updateProp('h', +e.target.value)} className="w-full" />
                  </>
                )}

                {(selectedElement === 'name' || selectedElement === 'section') && (
                  <>
                    <label className="text-xs font-bold block border-t pt-4">Font Size</label>
                    <input type="range" min="8" max="72" value={(elements[selectedElement] as any).fontSize} onChange={(e) => updateProp('fontSize', +e.target.value)} className="w-full" />
                    <label className="text-xs font-bold block">Color</label>
                    <input type="color" value={(elements[selectedElement] as any).color} onChange={(e) => updateProp('color', e.target.value)} className="w-full h-8" />
                  </>
                )}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">3. Canvas Settings</h3>
            <div className="space-y-3">
              {/* Presets */}
              <div className="grid grid-cols-1 gap-1">
                {presets.map(p => (
                  <button 
                    key={p.label}
                    onClick={() => { setCardWidth(p.width); setCardHeight(p.height); }}
                    className="text-[10px] bg-white border p-1 hover:bg-gray-100 text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Manual Dimensions */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold">Width</label>
                  <input 
                    type="number" 
                    value={cardWidth} 
                    onChange={(e) => handleDimensionChange('width', +e.target.value)}
                    className="w-full border p-1 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold">Height</label>
                  <input 
                    type="number" 
                    value={cardHeight} 
                    onChange={(e) => handleDimensionChange('height', +e.target.value)}
                    className="w-full border p-1 text-xs"
                  />
                </div>
              </div>

              {/* Zoom Slider */}
              <div>
                <label className="text-[9px] uppercase font-bold">Zoom ({Math.round(zoom * 100)}%)</label>
                <input 
                  type="range" min="0.1" max="2" step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(+e.target.value)} 
                  className="w-full" 
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-gray-200 relative overflow-auto flex items-center justify-center p-10">
          <div style={{ 
            width: `${cardWidth * zoom}px`, 
            height: `${cardHeight * zoom}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'width 0.2s, height 0.2s' 
          }}>
            
            <div 
              className="relative bg-white shadow-2xl shrink-0" 
              style={{ 
                width: `${cardWidth}px`, 
                height: `${cardHeight}px`, 
                backgroundImage: bgImage ? `url(${bgImage})` : 'none', 
                backgroundSize: '100% 100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {(Object.keys(elements) as ElementKey[]).map((key) => (
                <Draggable 
                  key={key} 
                  nodeRef={refs[key]} 
                  bounds="parent" 
                  // 3. Scale the dragging speed to match the zoom level
                  scale={zoom} 
                  position={{ x: elements[key].x, y: elements[key].y }} 
                  onStart={() => setSelectedElement(key)} 
                  onStop={(e, d) => setElements(prev => ({ ...prev, [key]: { ...prev[key], x: d.x, y: d.y } }))}
                >
                  <div 
                    ref={refs[key]} 
                    className={`absolute cursor-move flex items-center justify-center border-2 border-dashed ${
                      selectedElement === key ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-400'
                    }`} 
                    style={{ 
                      width: elements[key].w, 
                      height: elements[key].h, 
                      color: (elements[key] as any).color || '#000', 
                      fontSize: `${(elements[key] as any).fontSize || 10}px` 
                    }}
                  >
                    {key}
                  </div>
                </Draggable>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutConfigModal;