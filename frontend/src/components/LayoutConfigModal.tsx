import React from 'react';
import Draggable from 'react-draggable';
import { useLayoutConfig } from '../hooks/useLayoutConfig';
import type { ElementKey } from '../hooks/useLayoutConfig';

const LayoutConfigModal = ({ orderId, onClose }: { orderId: number; onClose: () => void }) => {
  const {
    bgImage,
    loading,
    selectedElement,
    setSelectedElement,
    previewImage,
    setPreviewImage,
    previewing,
    cardWidth,
    setCardWidth,
    cardHeight,
    setCardHeight,
    zoom,
    setZoom,
    toggles,
    setToggles,
    elements,
    refs,
    presets,
    updateProp,
    handleElementDrag,
    handleFileChange,
    saveLayout,
    handlePreview,
  } = useLayoutConfig({ orderId, onClose });

  const textFields: ElementKey[] = ['name', 'section', 'student_id', 'school_name', 'batch_name', 'signature_line'];

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden font-sans text-gray-900">
      <header className="h-16 border-b bg-gray-900 text-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose}>✕</button>
          <h1 className="text-lg font-black uppercase">Designer / Order #{orderId}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="bg-gray-700 px-5 py-2 rounded font-bold text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            {previewing ? 'Rendering...' : '👁 Preview'}
          </button>
          <button onClick={saveLayout} disabled={loading} className="bg-indigo-500 px-8 py-2 rounded font-bold">
            {loading ? "Saving..." : "Publish Template"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r bg-gray-50 p-6 flex flex-col gap-6 overflow-y-scroll">
          
          {/* 1. Background */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">1. Background</h3>
            <input type="file" onChange={handleFileChange} className="text-xs w-full" />
          </div>

          {/* 2. Inspector */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">2. Inspector: {selectedElement}</h3>
            <div className="space-y-4">
              <label className="text-xs font-bold block">Width ({elements[selectedElement].w}px)</label>
              <input type="range" min="10" max="400" value={elements[selectedElement].w} onChange={(e) => updateProp('w', +e.target.value)} className="w-full" />

              {selectedElement !== 'qr' && selectedElement !== 'signature_line' && (
                <>
                  <label className="text-xs font-bold block">Height ({elements[selectedElement].h}px)</label>
                  <input type="range" min="10" max="500" value={elements[selectedElement].h} onChange={(e) => updateProp('h', +e.target.value)} className="w-full" />
                </>
              )}

              {textFields.includes(selectedElement) && (
                <>
                  <label className="text-xs font-bold block border-t pt-4">Font Size</label>
                  <input type="range" min="8" max="72" value={(elements[selectedElement] as any).fontSize ?? 16} onChange={(e) => updateProp('fontSize', +e.target.value)} className="w-full" />
                  <label className="text-xs font-bold block">Color</label>
                  <input type="color" value={(elements[selectedElement] as any).color ?? '#000000'} onChange={(e) => updateProp('color', e.target.value)} className="w-full h-8" />
                </>
              )}
            </div>
          </div>

          {/* 3. Visible Fields */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-3">3. Visible Fields</h3>
            <div className="space-y-2">
              {(Object.keys(toggles) as (keyof typeof toggles)[]).map(key => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={e => setToggles(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded"
                  />
                  {key.replace('show_', '').replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>

          {/* 4. Canvas Settings */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">4. Canvas Settings</h3>
            <div className="space-y-3">
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
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold">Width</label>
                  <input type="number" value={cardWidth} onChange={(e) => setCardWidth(+e.target.value)} className="w-full border p-1 text-xs" />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold">Height</label>
                  <input type="number" value={cardHeight} onChange={(e) => setCardHeight(+e.target.value)} className="w-full border p-1 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold">Zoom ({Math.round(zoom * 100)}%)</label>
                <input type="range" min="0.1" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-full" />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-gray-200 relative overflow-auto flex items-center justify-center p-10">
          {/* Preview overlay */}
          {previewImage && (
            <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl p-4 shadow-2xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold">Preview (First Student)</p>
                  <button onClick={() => setPreviewImage(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <img src={previewImage} alt="ID Preview" className="max-w-full rounded" />
              </div>
            </div>
          )}

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
                  scale={zoom}
                  position={{ x: elements[key].x, y: elements[key].y }}
                  onStart={() => setSelectedElement(key)}
                  onStop={(e, d) => handleElementDrag(key, d.x, d.y)}
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