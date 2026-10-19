import { useState, useRef, useCallback } from 'react'
import Draggable from 'react-draggable'
import {
  Users, Calendar, Clock, Search, ChevronRight,
  ZoomIn, ZoomOut, Grid3x3, Eye, Save,
  ImageIcon, X, User, QrCode, Type, CreditCard,
  Bold, Italic, AlignLeft, AlignCenter,
  ChevronUp, ChevronDown, Lock, Layers,
  LayoutTemplate, ArrowLeft, Plus, Trash2,
} from 'lucide-react'
import { useOrders } from '../../context/OrderContext'
import { useLayoutConfig } from '../../hooks/useLayoutConfig'
import type { ElementKey, ElementProps } from '../../hooks/useLayoutConfig'
import { cn } from '../../lib/utils'

// ── Order selection ────────────────────────────────────────────────────────────

function OrderSelectionView({ onSelect }: { onSelect: (order: any) => void }) {
  const { orders } = useOrders()
  const [query, setQuery] = useState('')

  const eligible = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status))
  const filtered = eligible.filter((o) => {
    const q = query.toLowerCase()
    return String(o.id).includes(q) ||
      (o.school_name ?? '').toLowerCase().includes(q) ||
      (o.batch_name ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="px-8 py-7 max-w-6xl mx-auto w-full">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 mb-1 tracking-tight">Select an Order</h2>
          <p className="text-[13px] text-gray-500">Choose an order to begin designing or continue editing its ID card layout.</p>
        </div>
        <div className="relative shrink-0 w-64">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((order) => (
          <div key={order.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{order.id}</span>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
                    order.status === 'PENDING' ? 'text-gray-400 bg-gray-100' : 'text-amber-600 bg-amber-50',
                  )}>
                    {order.status}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1 truncate">{order.school_name}</h3>
                <div className="flex items-center gap-3 text-[12px] text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><Users size={11} />{order.student_count?.toLocaleString()} students</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{order.batch_name}</span>
                  {order.deadline && (
                    <span className="flex items-center gap-1"><Calendar size={11} />Due {new Date(order.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-50 flex justify-end">
              <button
                onClick={() => onSelect(order)}
                className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200 hover:shadow-md group-hover:scale-105 duration-200"
              >
                Open Layout <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Element metadata ───────────────────────────────────────────────────────────

const ELEMENT_LABELS: Record<ElementKey, string> = {
  photo: 'Student Photo',
  name: 'Full Name',
  section: 'Grade / Section',
  qr: 'QR Code',
  barcode: 'Barcode',
  student_id: 'Student ID',
  school_name: 'School Name',
  batch_name: 'Batch Name',
  signature_line: 'Signature Line',
}

const PALETTE: { key: ElementKey; icon: React.ElementType; label: string }[] = [
  { key: 'photo', icon: User, label: 'Student Photo' },
  { key: 'name', icon: Type, label: 'Full Name' },
  { key: 'student_id', icon: CreditCard, label: 'Student ID' },
  { key: 'section', icon: Type, label: 'Grade/Section' },
  { key: 'school_name', icon: Type, label: 'School Name' },
  { key: 'batch_name', icon: Type, label: 'Batch Name' },
  { key: 'qr', icon: QrCode, label: 'QR Code' },
  { key: 'barcode', icon: LayoutTemplate, label: 'Barcode' },
  { key: 'signature_line', icon: Type, label: 'Signature' },
]

// ── Resizable canvas element ──────────────────────────────────────────────────
//
// Wraps a Draggable. When selected it shows 8 resize handles (corners + edges).
// Resize uses pointer capture so dragging outside the card still works.

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
}

function ResizableElement({
  elementKey,
  el,
  selected,
  zoom,
  label,
  nodeRef,
  onSelect,
  onDragStop,
  onResize,
}: {
  elementKey: ElementKey
  el: ElementProps
  selected: boolean
  zoom: number
  label: string
  nodeRef: React.RefObject<any>
  onSelect: () => void
  onDragStop: (x: number, y: number) => void
  onResize: (patch: Partial<ElementProps>) => void
}) {
  const resizeStart = useRef<{
    handle: ResizeHandle
    startX: number; startY: number
    origX: number; origY: number
    origW: number; origH: number
  } | null>(null)

  const onPointerDown = useCallback((handle: ResizeHandle, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
      ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
    resizeStart.current = {
      handle,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
      origW: el.w, origH: el.h,
    }
  }, [el])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const rs = resizeStart.current
    if (!rs) return
    e.preventDefault()
    const dx = (e.clientX - rs.startX) / zoom
    const dy = (e.clientY - rs.startY) / zoom
    const MIN = 20
    const { origX, origY, origW, origH, handle: h_str } = rs

    let x = origX, y = origY, w = origW, h = origH

    if (h_str.includes('e')) w = Math.max(MIN, origW + dx)
    if (h_str.includes('s')) h = Math.max(MIN, origH + dy)
    if (h_str.includes('w')) { w = Math.max(MIN, origW - dx); x = origX + origW - w }
    if (h_str.includes('n')) { h = Math.max(MIN, origH - dy); y = origY + origH - h }

    onResize({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) })
  }, [zoom, onResize])

  const onPointerUp = useCallback(() => {
    resizeStart.current = null
  }, [])

  const handlePositions: Record<ResizeHandle, { top?: string; bottom?: string; left?: string; right?: string; transform: string }> = {
    nw: { top: '-4px', left: '-4px', transform: 'none' },
    n: { top: '-4px', left: '50%', transform: 'translateX(-50%)' },
    ne: { top: '-4px', right: '-4px', transform: 'none' },
    e: { top: '50%', right: '-4px', transform: 'translateY(-50%)' },
    se: { bottom: '-4px', right: '-4px', transform: 'none' },
    s: { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: '-4px', left: '-4px', transform: 'none' },
    w: { top: '50%', left: '-4px', transform: 'translateY(-50%)' },
  }

  return (
    <Draggable
      key={`${elementKey}-${el.w}-${el.h}`}
      nodeRef={nodeRef}
      bounds="parent"
      scale={zoom}
      position={{ x: el.x, y: el.y }}
      onStart={onSelect}
      onStop={(_, d) => onDragStop(d.x, d.y)}
      // Disable drag while a resize is in progress
      disabled={!!resizeStart.current}
    >
      <div
        ref={nodeRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          'absolute flex items-center justify-center border-2 border-dashed select-none',
          selected
            ? 'border-blue-500 bg-blue-50/40 cursor-move z-20'
            : 'border-gray-300/70 hover:border-blue-400 cursor-move z-10',
        )}
        style={{
          width: el.w,
          height: el.h,
          color: el.color || '#000',
          fontSize: `${el.fontSize || 11}px`,
          left: el.x,
          top: el.y,
          // position is controlled by Draggable via transform, override here needed
          position: 'absolute',
        }}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
      >
        {/* Field label */}
        <span className="text-[10px] text-gray-500 font-medium select-none px-1 text-center leading-tight pointer-events-none">
          {label}
        </span>

        {/* Selected: label badge + resize handles */}
        {selected && (
          <>
            <div className="absolute -top-5 left-0 bg-blue-600 text-white rounded-t px-1.5 py-0.5 whitespace-nowrap pointer-events-none text-[8px] font-semibold z-30">
              {label}
            </div>
            {(Object.keys(handlePositions) as ResizeHandle[]).map((h) => (
              <div
                key={h}
                className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm z-30"
                style={{ cursor: HANDLE_CURSORS[h], ...handlePositions[h] }}
                onPointerDown={(e) => onPointerDown(h, e)}
              />
            ))}
          </>
        )}
      </div>
    </Draggable>
  )
}

// ── Layout builder view ────────────────────────────────────────────────────────

function LayoutBuilderView({ order, onBack }: { order: any; onBack: () => void }) {
  const [showGrid, setShowGrid] = useState(true)
  const [templateInputKey, setTemplateInputKey] = useState(0)
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT')

  const {
    bgImage, loading, saved,
    selectedElement, setSelectedElement,
    previewImage, setPreviewImage, previewing,
    cardWidth, setCardWidth,
    cardHeight, setCardHeight,
    zoom, setZoom,
    toggles, setToggles,
    elements, refs, presets,
    activeFields,
    addField, removeField,
    updateProp, handleElementDrag, handleFileChange,
    patchElement,
    saveLayout, handlePreview,
  } = useLayoutConfig({ orderId: order.id, side, onClose: onBack })

  const textFields: ElementKey[] = ['name', 'section', 'student_id', 'school_name', 'batch_name', 'signature_line']
  const sel = selectedElement ? elements[selectedElement] : null

  const handleResize = useCallback((key: ElementKey, patch: Partial<ElementProps>) => {
    if (selectedElement !== key) setSelectedElement(key)
    patchElement(key, patch)
  }, [selectedElement, setSelectedElement, patchElement])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-white overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white z-10 flex-shrink-0 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors mr-1">
          <ArrowLeft size={13} /> Orders
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />
        <span className="text-[12px] font-medium text-gray-500">
          #{order.id} · <span className="text-gray-800">{order.school_name}</span>
        </span>
        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Front/Back toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(['FRONT', 'BACK'] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)}
              className={cn(
                'flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-md transition-all',
                side === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', side === s ? (s === 'FRONT' ? 'bg-blue-500' : 'bg-violet-500') : 'bg-gray-300')} />
              {s === 'FRONT' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Zoom */}
        <button onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">
          <ZoomOut size={15} />
        </button>
        <span className="text-[12px] font-medium text-gray-600 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">
          <ZoomIn size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Grid toggle */}
        <button onClick={() => setShowGrid((v) => !v)} className={cn('w-8 h-8 flex items-center justify-center rounded transition-colors', showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500')}>
          <Grid3x3 size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Background */}
        <label className={cn(
          'flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors border cursor-pointer',
          bgImage ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200 hover:border-blue-200',
        )}>
          <ImageIcon size={13} />
          {bgImage ? 'Replace Background' : 'Add Background'}
          <input key={templateInputKey} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFileChange(e); setTemplateInputKey((k) => k + 1) }} />
        </label>

        <div className="flex-1" />

        <button onClick={handlePreview} disabled={previewing} className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          <Eye size={14} />
          {previewing ? 'Rendering…' : 'Preview'}
        </button>
        <button onClick={saveLayout} disabled={loading} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-all shadow-sm shadow-blue-200 disabled:opacity-60 ml-1">
          <Save size={14} />
          {loading ? 'Saving…' : 'Publish Template'}
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Palette ────────────────────────────────────────── */}
        <aside className="w-[220px] border-r border-gray-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Elements</h3>
            <p className="text-[10px] text-gray-400 mt-1 leading-4">Click + to place a field on the {side.toLowerCase()} canvas.</p>
          </div>

          <div className="px-3 py-3 flex flex-col gap-1 flex-1">
            {PALETTE.map(({ key, icon: Icon, label }) => {
              const onCanvas = activeFields.includes(key)
              return (
                <div key={key} className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all',
                  onCanvas
                    ? selectedElement === key
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-blue-100 bg-blue-50/50 hover:border-blue-300'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30',
                )}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', onCanvas ? 'bg-blue-100' : 'bg-gray-100')}>
                    <Icon size={14} className={onCanvas ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <button
                    onClick={() => onCanvas ? setSelectedElement(key) : addField(key)}
                    className="flex-1 text-left text-[12px] font-medium text-gray-700 hover:text-blue-700 truncate"
                  >
                    {label}
                  </button>
                  {onCanvas ? (
                    <button onClick={() => removeField(key)} title="Remove from canvas"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                      <X size={11} />
                    </button>
                  ) : (
                    <button onClick={() => addField(key)} title={`Add ${label}`}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-blue-100 text-gray-300 hover:text-blue-600 transition-colors shrink-0">
                      <Plus size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Visibility toggles */}
          <div className="px-4 py-3 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Visibility</h3>
            <div className="space-y-1.5">
              {(Object.keys(toggles) as (keyof typeof toggles)[]).map((key) => (
                <label key={key} className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input type="checkbox" checked={toggles[key]} onChange={(e) => setToggles((p) => ({ ...p, [key]: e.target.checked }))} className="rounded accent-blue-600 w-3.5 h-3.5" />
                  <span className="text-gray-600 truncate">{key.replace('show_', '').replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Canvas ──────────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: '#E8E8E8',
            backgroundImage: showGrid ? 'radial-gradient(circle, #b0b0b0 1px, transparent 1px)' : 'none',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-10 relative"
            onClick={() => setSelectedElement(null)}
          >
            {/* Preview overlay */}
            {previewImage && (
              <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 shadow-2xl max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-800">Preview (First Student)</p>
                    <button onClick={() => setPreviewImage(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                  <img src={previewImage} alt="ID Preview" className="max-w-full rounded" />
                </div>
              </div>
            )}

            {/* Empty state hint */}
            {activeFields.length === 0 && !bgImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-gray-400">Canvas is empty</p>
                  <p className="text-[12px] text-gray-300 mt-1">Add a background and click + on elements to begin</p>
                </div>
              </div>
            )}

            {/* Card info pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 shadow-sm pointer-events-none z-20">
              <span className={cn('w-1.5 h-1.5 rounded-full', side === 'FRONT' ? 'bg-blue-500' : 'bg-violet-500')} />
              {side === 'FRONT' ? 'Front Side' : 'Back Side'}
              <span className="text-gray-300">·</span>
              <span className="text-gray-700 font-semibold">{order.school_name}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{cardWidth}×{cardHeight}px</span>
              {saved && <><span className="text-gray-300">·</span><span className="text-emerald-600 font-semibold">Saved</span></>}
            </div>

            {/* Card canvas */}
            <div style={{ width: `${cardWidth * zoom}px`, height: `${cardHeight * zoom}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                className="relative bg-white shadow-2xl shrink-0 overflow-hidden"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                  backgroundSize: '100% 100%',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              >
                {activeFields.map((key) => {
                  const el = elements[key]
                  if (!el) return null
                  return (
                    <ResizableElement
                      key={`${side}-${key}`}
                      elementKey={key}
                      el={el}
                      selected={selectedElement === key}
                      zoom={zoom}
                      label={ELEMENT_LABELS[key]}
                      nodeRef={refs[key]}
                      onSelect={() => setSelectedElement(key)}
                      onDragStop={(x, y) => handleElementDrag(key, x, y)}
                      onResize={(patch) => handleResize(key, patch)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Properties ──────────────────────────────────────── */}
        <aside className="w-[250px] border-l border-gray-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">

          {/* Transform */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            {sel && selectedElement ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-semibold text-gray-700 truncate">{ELEMENT_LABELS[selectedElement]}</span>
                  <button onClick={() => removeField(selectedElement)} title="Remove" className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([['X', 'x'], ['Y', 'y'], ['W', 'w'], ['H', 'h']] as const).map(([label, field]) => (
                    <div key={field}>
                      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label} (px)</div>
                      <input
                        type="number"
                        value={Math.round((sel as any)[field] ?? 0)}
                        min={field === 'w' || field === 'h' ? 10 : undefined}
                        onChange={(e) => updateProp(field, +e.target.value)}
                        className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}
                </div>

                {textFields.includes(selectedElement) && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Font Size ({(sel as any).fontSize ?? 16}px)</div>
                      <input type="range" min="8" max="72" value={(sel as any).fontSize ?? 16} onChange={(e) => updateProp('fontSize', +e.target.value)} className="w-full accent-blue-600" />
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Color</div>
                      <input type="color" value={(sel as any).color ?? '#000000'} onChange={(e) => updateProp('color', e.target.value)} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-center text-[12px] text-gray-400">
                <p>No element selected</p>
                <p className="text-[11px] mt-1 text-gray-300">Click an element on the canvas</p>
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Type size={13} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-700">Typography</span>
            </div>
            <div className="flex items-center gap-1">
              {[Bold, Italic, AlignLeft, AlignCenter].map((Icon, i) => (
                <button key={i} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          {/* Canvas settings */}
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-[12px] font-semibold text-gray-700 block mb-3">Canvas</span>
            <div className="space-y-1.5 mb-3">
              {presets.map((p) => (
                <button key={p.label} onClick={() => { setCardWidth(p.width); setCardHeight(p.height) }}
                  className="w-full text-left text-[11px] bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([['Width', cardWidth, setCardWidth], ['Height', cardHeight, setCardHeight]] as const).map(([label, val, setter]) => (
                <div key={label as string}>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label as string}</div>
                  <input type="number" value={val as number} onChange={(e) => (setter as (n: number) => void)(+e.target.value)}
                    className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none focus:border-blue-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Layers */}
          <div className="px-4 py-3 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-700">Layers ({activeFields.length})</span>
            </div>
            {activeFields.length === 0 ? (
              <p className="text-[11px] text-gray-300 italic">No fields added yet</p>
            ) : (
              <div className="space-y-1">
                {[...activeFields].reverse().map((key) => (
                  <div key={key} onClick={() => setSelectedElement(key)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                      selectedElement === key ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent',
                    )}>
                    <span className={cn('text-[12px] flex-1 truncate', selectedElement === key ? 'text-blue-700 font-medium' : 'text-gray-600')}>
                      {ELEMENT_LABELS[key]}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors"><ChevronUp size={10} /></button>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors"><ChevronDown size={10} /></button>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-300 transition-colors"><Lock size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
