import { useState } from 'react'
import Draggable from 'react-draggable'
import {
  Users, Calendar, Clock, Search, ChevronRight,
  Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3, Eye, Save,
  ImageIcon, X, User, QrCode, Type, CreditCard,
  Bold, Italic, AlignLeft, AlignCenter,
  ChevronUp, ChevronDown, Lock, Layers,
  LayoutTemplate, ArrowLeft,
} from 'lucide-react'
import { useOrders } from '../context/OrderContext'
import { useLayoutConfig } from '../hooks/useLayoutConfig'
import type { ElementKey } from '../hooks/useLayoutConfig'
import { cn } from '../lib/utils'

// ── Order selection ────────────────────────────────────────────────────────────

function OrderSelectionView({ onSelect }: { onSelect: (order: any) => void }) {
  const { orders } = useOrders()
  const [query, setQuery] = useState('')

  // Only show orders that need a layout (non-completed, non-cancelled)
  const eligible = orders.filter((o) =>
    !['COMPLETED', 'CANCELLED'].includes(o.status)
  )

  const filtered = eligible.filter((o) => {
    const q = query.toLowerCase()
    return (
      String(o.id).includes(q) ||
      (o.school_name ?? '').toLowerCase().includes(q) ||
      (o.batch_name  ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="px-8 py-7 max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 mb-1 tracking-tight">Select an Order</h2>
          <p className="text-[13px] text-gray-500">
            Choose an order to begin designing or continue editing its ID card layout.
          </p>
        </div>
        <div className="relative shrink-0 w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-[14px] text-gray-400">
          {query ? `No orders match "${query}"` : 'No eligible orders found.'}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((order) => (
          <div
            key={order.id}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    #{order.id}
                  </span>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
                    order.status === 'PENDING'
                      ? 'text-gray-400 bg-gray-100'
                      : 'text-amber-600 bg-amber-50',
                  )}>
                    {order.status}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{order.school_name}</h3>
                <div className="flex items-center gap-4 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {order.student_count?.toLocaleString()} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {order.batch_name}
                  </span>
                  {order.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due {new Date(order.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onSelect(order)}
                className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 hover:shadow-md group-hover:scale-105 duration-200"
              >
                Open Layout
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Canvas element renderer ────────────────────────────────────────────────────

const ELEMENT_LABELS: Record<ElementKey, string> = {
  photo:          'Student Photo',
  name:           'Full Name',
  section:        'Grade / Section',
  qr:             'QR Code',
  barcode:        'Barcode',
  student_id:     'Student ID',
  school_name:    'School Name',
  batch_name:     'Batch Name',
  signature_line: 'Signature Line',
}

// ── Layout builder view ────────────────────────────────────────────────────────

function LayoutBuilderView({
  order,
  onBack,
}: {
  order: any
  onBack: () => void
}) {
  const [showGrid, setShowGrid] = useState(true)
  const [templateInputKey, setTemplateInputKey] = useState(0)
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT')

  const {
    bgImage, loading, saved,
    selectedElement, setSelectedElement,
    previewImage, setPreviewImage,
    previewing,
    cardWidth, setCardWidth,
    cardHeight, setCardHeight,
    zoom, setZoom,
    toggles, setToggles,
    elements, refs, presets,
    updateProp,
    handleElementDrag,
    handleFileChange,
    saveLayout,
    handlePreview,
  } = useLayoutConfig({ orderId: order.id, side, onClose: onBack })

  const textFields: ElementKey[] = ['name', 'section', 'student_id', 'school_name', 'batch_name', 'signature_line']
  const sel = elements[selectedElement]

  const elementPalette: { key: ElementKey; icon: React.ElementType; label: string }[] = [
    { key: 'photo',          icon: User,       label: 'Student Photo' },
    { key: 'qr',             icon: QrCode,     label: 'QR Code'       },
    { key: 'name',           icon: Type,       label: 'Full Name'     },
    { key: 'student_id',     icon: CreditCard, label: 'Student ID'    },
    { key: 'section',        icon: Type,       label: 'Grade/Section' },
    { key: 'school_name',    icon: Type,       label: 'School Name'   },
    { key: 'batch_name',     icon: Type,       label: 'Batch Name'    },
    { key: 'signature_line', icon: Type,       label: 'Signature'     },
    { key: 'barcode',        icon: LayoutTemplate, label: 'Barcode'   },
  ]

  const elementKeys = Object.keys(elements) as ElementKey[]

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-white overflow-hidden">

      {/* ── Top toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors mr-1"
        >
          <ArrowLeft size={13} />
          Orders
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Order context */}
        <span className="text-[12px] font-medium text-gray-500">
          #{order.id} · <span className="text-gray-800">{order.school_name}</span>
        </span>

        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Front / Back side toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(['FRONT', 'BACK'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                'flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-md transition-all',
                side === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                side === s
                  ? (s === 'FRONT' ? 'bg-blue-500' : 'bg-violet-500')
                  : 'bg-gray-300',
              )} />
              {s === 'FRONT' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Undo/Redo (visual, state managed inside hook) */}
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors">
          <Undo2 size={15} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors">
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Zoom */}
        <button
          onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ZoomOut size={15} />
        </button>
        <span className="text-[12px] font-medium text-gray-600 w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ZoomIn size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid((v) => !v)}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded transition-colors',
            showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500',
          )}
        >
          <Grid3x3 size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Background upload */}
        <label className={cn(
          'flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors border cursor-pointer',
          bgImage
            ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200 hover:border-blue-200',
        )}>
          <ImageIcon size={13} />
          {bgImage ? 'Replace BG' : 'Upload BG'}
          <input
            key={templateInputKey}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFileChange(e)
              setTemplateInputKey((k) => k + 1)
            }}
          />
        </label>
        {bgImage && (
          <button
            onClick={() => {/* clear handled by uploading new */}}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
            title="Remove background"
          >
            <X size={12} />
          </button>
        )}

        <div className="flex-1" />

        {/* Preview */}
        <button
          onClick={handlePreview}
          disabled={previewing}
          className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Eye size={14} />
          {previewing ? 'Rendering…' : 'Preview'}
        </button>

        {/* Save */}
        <button
          onClick={saveLayout}
          disabled={loading}
          className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-all shadow-sm shadow-blue-200 disabled:opacity-60 ml-1"
        >
          <Save size={14} />
          {loading ? 'Saving…' : 'Publish Template'}
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Elements palette + field toggles ──────────────────── */}
        <aside className="w-[240px] border-r border-gray-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">

          {/* Element palette */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Elements</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 px-3 pb-4">
            {elementPalette.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setSelectedElement(key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all group',
                  selectedElement === key
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50',
                )}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
                  <Icon size={16} className="text-blue-500" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 group-hover:text-blue-700 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Field visibility toggles */}
          <div className="px-4 py-3 border-t border-gray-100 flex-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Visible Fields</h3>
            <div className="space-y-2">
              {(Object.keys(toggles) as (keyof typeof toggles)[]).map((key) => (
                <label key={key} className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={(e) => setToggles((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded accent-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-gray-600">
                    {key.replace('show_', '').replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Centre: Canvas ─────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: '#E8E8E8',
            backgroundImage: showGrid
              ? 'radial-gradient(circle, #b0b0b0 1px, transparent 1px)'
              : 'none',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="flex-1 overflow-auto flex items-center justify-center p-10 relative">

            {/* Preview overlay */}
            {previewImage && (
              <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 shadow-2xl max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-800">Preview (First Student)</p>
                    <button onClick={() => setPreviewImage(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <img src={previewImage} alt="ID Preview" className="max-w-full rounded" />
                </div>
              </div>
            )}

            {/* Card info pill */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 shadow-sm pointer-events-none">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                side === 'FRONT' ? 'bg-blue-500' : 'bg-violet-500',
              )} />
              {side === 'FRONT' ? 'Front Side' : 'Back Side'}
              <span className="text-gray-300">·</span>
              <span className="text-gray-700 font-semibold">{order.school_name}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{cardWidth}×{cardHeight}px</span>
              {saved && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-emerald-600 font-semibold">Saved</span>
                </>
              )}
            </div>

            {/* The actual card canvas */}
            <div style={{
              width: `${cardWidth * zoom}px`,
              height: `${cardHeight * zoom}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div
                className="relative bg-white shadow-2xl shrink-0"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                  backgroundSize: '100% 100%',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              >
                {elementKeys.map((key) => (
                  <Draggable
                    key={key}
                    nodeRef={refs[key]}
                    bounds="parent"
                    scale={zoom}
                    position={{ x: elements[key].x, y: elements[key].y }}
                    onStart={() => setSelectedElement(key)}
                    onStop={(_, d) => handleElementDrag(key, d.x, d.y)}
                  >
                    <div
                      ref={refs[key]}
                      className={cn(
                        'absolute cursor-move flex items-center justify-center border-2 border-dashed',
                        selectedElement === key
                          ? 'border-blue-500 bg-blue-50/40'
                          : 'border-gray-300/60 hover:border-gray-400',
                      )}
                      style={{
                        width:    elements[key].w,
                        height:   elements[key].h,
                        color:    (elements[key] as any).color   || '#000',
                        fontSize: `${(elements[key] as any).fontSize || 10}px`,
                      }}
                    >
                      <span className="text-[10px] text-gray-500 font-medium select-none px-1 text-center leading-tight">
                        {ELEMENT_LABELS[key]}
                      </span>
                      {selectedElement === key && (
                        <div className="absolute -top-5 left-0 bg-blue-600 text-white rounded-t px-1.5 py-0.5 whitespace-nowrap pointer-events-none text-[8px] font-semibold">
                          {ELEMENT_LABELS[key]}
                        </div>
                      )}
                    </div>
                  </Draggable>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Properties ────────────────────────────────────────── */}
        <aside className="w-[260px] border-l border-gray-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">

          {/* Transform */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-sm border border-gray-400" />
              </div>
              <span className="text-[12px] font-semibold text-gray-700">
                Transform — {ELEMENT_LABELS[selectedElement]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([['X', 'x'], ['Y', 'y'], ['W', 'w'], ['H', 'h']] as const).map(([label, field]) => (
                <div key={field}>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label} (px)</div>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <input
                      type="number"
                      value={Math.round((sel as any)[field] ?? 0)}
                      onChange={(e) => updateProp(field, +e.target.value)}
                      className="flex-1 min-w-0 text-[12px] text-gray-700 bg-transparent px-2 py-1.5 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Font size + color for text fields */}
            {textFields.includes(selectedElement) && (
              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Font Size ({(sel as any).fontSize ?? 16}px)
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={(sel as any).fontSize ?? 16}
                    onChange={(e) => updateProp('fontSize', +e.target.value)}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Color</div>
                  <input
                    type="color"
                    value={(sel as any).color ?? '#000000'}
                    onChange={(e) => updateProp('color', e.target.value)}
                    className="w-full h-8 rounded cursor-pointer border border-gray-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Typography (visual only) */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Type size={13} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-700">Typography</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { Icon: Bold,        label: 'bold'   },
                { Icon: Italic,      label: 'italic' },
                { Icon: AlignLeft,   label: 'left'   },
                { Icon: AlignCenter, label: 'center' },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          {/* Canvas settings */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12px] font-semibold text-gray-700">Canvas</span>
            </div>
            <div className="space-y-2 mb-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setCardWidth(p.width); setCardHeight(p.height) }}
                  className="w-full text-left text-[11px] bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['Width', cardWidth, setCardWidth], ['Height', cardHeight, setCardHeight]] .map(([label, val, setter]) => (
                <div key={label as string}>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label as string}</div>
                  <input
                    type="number"
                    value={val as number}
                    onChange={(e) => (setter as (n: number) => void)(+e.target.value)}
                    className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Layers */}
          <div className="px-4 py-3 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-700">Layers</span>
            </div>
            <div className="space-y-1">
              {[...elementKeys].reverse().map((key) => {
                const isSelected = selectedElement === key
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedElement(key)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent',
                    )}
                  >
                    <span className={cn(
                      'text-[12px] flex-1 truncate',
                      isSelected ? 'text-blue-700 font-medium' : 'text-gray-600',
                    )}>
                      {ELEMENT_LABELS[key]}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors">
                        <ChevronUp size={10} />
                      </button>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors">
                        <ChevronDown size={10} />
                      </button>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors">
                        <Lock size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LayoutBuilderPage() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  return selectedOrder
    ? <LayoutBuilderView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
    : <OrderSelectionView onSelect={setSelectedOrder} />
}
