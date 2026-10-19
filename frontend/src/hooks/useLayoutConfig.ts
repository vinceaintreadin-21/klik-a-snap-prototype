import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../utils/api'

export type ElementKey =
  | 'photo' | 'name' | 'section' | 'qr' | 'barcode'
  | 'student_id' | 'school_name' | 'batch_name' | 'signature_line'

export type LayoutSide = 'FRONT' | 'BACK'

export interface ElementProps {
  x: number
  y: number
  w: number
  h: number
  fontSize?: number
  color?: string
}

// Sensible defaults when a field is first dropped onto the canvas
const FIELD_DROP_DEFAULTS: Record<ElementKey, ElementProps> = {
  photo: { x: 50, y: 50, w: 150, h: 200 },
  name: { x: 50, y: 270, w: 220, h: 30, fontSize: 22, color: '#000000' },
  section: { x: 50, y: 310, w: 160, h: 25, fontSize: 16, color: '#333333' },
  qr: { x: 280, y: 480, w: 90, h: 90 },
  barcode: { x: 50, y: 500, w: 220, h: 55 },
  student_id: { x: 50, y: 350, w: 180, h: 25, fontSize: 16, color: '#000000' },
  school_name: { x: 50, y: 380, w: 220, h: 25, fontSize: 16, color: '#000000' },
  batch_name: { x: 50, y: 415, w: 200, h: 25, fontSize: 14, color: '#555555' },
  signature_line: { x: 50, y: 600, w: 200, h: 20, fontSize: 13, color: '#000000' },
}

const defaultToggles = (side: LayoutSide) =>
  side === 'FRONT'
    ? {
      show_full_name: true,
      show_student_id: true,
      show_grade_level: true,
      show_school_name: true,
      show_school_year: true,
      show_signature_line: false,
      show_qr_code: true,
      show_barcode: false,
    }
    : {
      show_full_name: false,
      show_student_id: true,
      show_grade_level: false,
      show_school_name: true,
      show_school_year: false,
      show_signature_line: true,
      show_qr_code: true,
      show_barcode: true,
    }

// Per-side canvas state — fully independent
interface SideState {
  bgImage: string | null
  bgFile: File | null
  // Only the keys present in this set are on the canvas
  activeFields: ElementKey[]
  elements: Partial<Record<ElementKey, ElementProps>>
  toggles: ReturnType<typeof defaultToggles>
  cardWidth: number
  cardHeight: number
  saved: boolean
}

const initSideState = (side: LayoutSide): SideState => ({
  bgImage: null,
  bgFile: null,
  // New orders start with an EMPTY canvas — user adds fields explicitly
  activeFields: [],
  elements: {},
  toggles: defaultToggles(side),
  cardWidth: 638,
  cardHeight: 1012,
  saved: false,
})

interface UseLayoutConfigProps {
  orderId: number
  side?: LayoutSide
  onClose?: () => void
}

export const useLayoutConfig = ({ orderId, side: sideProp, onClose: _onClose }: UseLayoutConfigProps) => {
  const side = sideProp ?? 'FRONT'

  const [frontState, setFrontState] = useState<SideState>(() => initSideState('FRONT'))
  const [backState, setBackState] = useState<SideState>(() => initSideState('BACK'))

  const current = side === 'FRONT' ? frontState : backState
  const setCurrent = useCallback(
    (updater: SideState | ((prev: SideState) => SideState)) => {
      if (side === 'FRONT') setFrontState(updater as any)
      else setBackState(updater as any)
    },
    [side],
  )

  // Convenience accessors
  const bgImage = current.bgImage
  const bgFile = current.bgFile
  const activeFields = current.activeFields
  const elements = current.elements
  const toggles = current.toggles
  const cardWidth = current.cardWidth
  const cardHeight = current.cardHeight
  const saved = current.saved

  const setElements = useCallback(
    (updater: Partial<Record<ElementKey, ElementProps>> | ((p: Partial<Record<ElementKey, ElementProps>>) => Partial<Record<ElementKey, ElementProps>>)) =>
      setCurrent((prev) => ({ ...prev, elements: typeof updater === 'function' ? updater(prev.elements) : updater })),
    [setCurrent],
  )
  const setToggles = useCallback(
    (updater: ReturnType<typeof defaultToggles> | ((p: ReturnType<typeof defaultToggles>) => ReturnType<typeof defaultToggles>)) =>
      setCurrent((prev) => ({ ...prev, toggles: typeof updater === 'function' ? updater(prev.toggles) : updater })),
    [setCurrent],
  )

  const setBgImage = (v: string | null) => setCurrent((p) => ({ ...p, bgImage: v }))
  const setBgFile = (v: File | null) => setCurrent((p) => ({ ...p, bgFile: v }))
  const setSaved = (v: boolean) => setCurrent((p) => ({ ...p, saved: v }))
  const setCardWidth = (v: number) => setCurrent((p) => ({ ...p, cardWidth: v }))
  const setCardHeight = (v: number) => setCurrent((p) => ({ ...p, cardHeight: v }))

  const [loading, setLoading] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementKey | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Stable refs — keyed by element key
  const refs: Record<ElementKey, React.RefObject<any>> = {
    photo: useRef(null),
    name: useRef(null),
    section: useRef(null),
    qr: useRef(null),
    barcode: useRef(null),
    student_id: useRef(null),
    school_name: useRef(null),
    batch_name: useRef(null),
    signature_line: useRef(null),
  }

  const presets = [
    { label: 'Standard (638×1012)', width: 638, height: 1012 },
    { label: 'Compact (600×900)', width: 600, height: 900 },
    { label: 'Wide (800×1000)', width: 800, height: 1000 },
  ]

  // ── Load existing layout from API ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/layout/`)
        const layout = res.data[side]
        if (!layout) return   // no saved layout for this side — keep empty canvas

        const cfg: Record<string, any> = layout.fields_config ?? {}

        // Reconstruct which fields were placed from fields_config + photo
        const loadedFields: ElementKey[] = []
        const loadedElements: Partial<Record<ElementKey, ElementProps>> = {}

        // Photo is separate from fields_config
        if (layout.photo_width > 0 || layout.photo_height > 0) {
          loadedFields.push('photo')
          loadedElements.photo = {
            x: layout.photo_x ?? 50,
            y: layout.photo_y ?? 50,
            w: layout.photo_width ?? 150,
            h: layout.photo_height ?? 200,
          }
        }

        const cfgKeyMap: Partial<Record<string, ElementKey>> = {
          full_name: 'name',
          grade_level: 'section',
          qr_code: 'qr',
          barcode: 'barcode',
          student_id: 'student_id',
          school_name: 'school_name',
          batch_name: 'batch_name',
          signature_line: 'signature_line',
        }

        for (const [cfgKey, elementKey] of Object.entries(cfgKeyMap)) {
          if (cfg[cfgKey]) {
            const f = cfg[cfgKey]
            loadedFields.push(elementKey!)
            loadedElements[elementKey!] = {
              x: f.x ?? FIELD_DROP_DEFAULTS[elementKey!].x,
              y: f.y ?? FIELD_DROP_DEFAULTS[elementKey!].y,
              w: f.width ?? f.size ?? FIELD_DROP_DEFAULTS[elementKey!].w,
              h: f.height ?? f.size ?? FIELD_DROP_DEFAULTS[elementKey!].h,
              fontSize: f.font_size ?? (FIELD_DROP_DEFAULTS[elementKey!] as any).fontSize,
              color: f.color ?? (FIELD_DROP_DEFAULTS[elementKey!] as any).color,
            }
          }
        }

        setCurrent((prev) => ({
          ...prev,
          saved: true,
          cardWidth: layout.card_width ?? 638,
          cardHeight: layout.card_height ?? 1012,
          bgImage: layout.background_image_url ?? prev.bgImage,
          activeFields: loadedFields,
          elements: loadedElements,
          toggles: {
            show_full_name: layout.show_full_name ?? defaultToggles(side).show_full_name,
            show_student_id: layout.show_student_id ?? defaultToggles(side).show_student_id,
            show_grade_level: layout.show_grade_level ?? defaultToggles(side).show_grade_level,
            show_school_name: layout.show_school_name ?? defaultToggles(side).show_school_name,
            show_school_year: layout.show_school_year ?? defaultToggles(side).show_school_year,
            show_signature_line: layout.show_signature_line ?? defaultToggles(side).show_signature_line,
            show_qr_code: layout.show_qr_code ?? defaultToggles(side).show_qr_code,
            show_barcode: layout.show_barcode ?? defaultToggles(side).show_barcode,
          },
        }))
      } catch { /* 404 = no layout yet, keep empty canvas — that's expected */ }
    }
    load()
  }, [orderId, side]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add a field to the canvas ──────────────────────────────────────────────
  const addField = useCallback((key: ElementKey) => {
    if (current.activeFields.includes(key)) {
      // Already on canvas — just select it
      setSelectedElement(key)
      return
    }
    setCurrent((prev) => ({
      ...prev,
      activeFields: [...prev.activeFields, key],
      elements: {
        ...prev.elements,
        [key]: FIELD_DROP_DEFAULTS[key],
      },
    }))
    setSelectedElement(key)
  }, [current.activeFields, setCurrent])

  // ── Remove a field from the canvas ────────────────────────────────────────
  const removeField = useCallback((key: ElementKey) => {
    setCurrent((prev) => {
      const { [key]: _removed, ...rest } = prev.elements
      return {
        ...prev,
        activeFields: prev.activeFields.filter((k) => k !== key),
        elements: rest,
      }
    })
    setSelectedElement((prev) => (prev === key ? null : prev))
  }, [setCurrent])

  // ── Update a single prop on the selected element ──────────────────────────
  const updateProp = useCallback((prop: string, value: any) => {
    if (!selectedElement) return
    setElements((prev) => ({
      ...prev,
      [selectedElement]: { ...(prev[selectedElement] ?? FIELD_DROP_DEFAULTS[selectedElement]), [prop]: value },
    }))
  }, [selectedElement, setElements])

  // ── Patch an element directly by key (used by resize handler) ─────────────
  const patchElement = useCallback((key: ElementKey, patch: Partial<ElementProps>) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? FIELD_DROP_DEFAULTS[key]), ...patch },
    }))
  }, [setElements])

  const handleElementDrag = useCallback((key: ElementKey, x: number, y: number) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? FIELD_DROP_DEFAULTS[key]), x, y },
    }))
  }, [setElements])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setBgFile(file); setBgImage(URL.createObjectURL(file)) }
  }

  // ── Save to backend ───────────────────────────────────────────────────────
  const saveLayout = async () => {
    if (!bgFile && !bgImage) return alert('Upload a background image first.')
    setLoading(true)

    const formData = new FormData()
    if (bgFile) formData.append('background_image', bgFile)
    formData.append('side', side)
    formData.append('card_width', cardWidth.toString())
    formData.append('card_height', cardHeight.toString())

    Object.entries(toggles).forEach(([k, v]) => formData.append(k, v.toString()))

    // Photo placement
    const photo = elements.photo ?? FIELD_DROP_DEFAULTS.photo
    formData.append('photo_x', Math.round(photo.x).toString())
    formData.append('photo_y', Math.round(photo.y).toString())
    formData.append('photo_width', Math.round(photo.w).toString())
    formData.append('photo_height', Math.round(photo.h).toString())

    // Only include fields that are actually on the canvas in fields_config
    const cfg: Record<string, any> = {}
    for (const key of activeFields) {
      if (key === 'photo') continue  // photo is sent separately above
      const el = elements[key]
      if (!el) continue
      const cfgKeyMap: Partial<Record<ElementKey, string>> = {
        name: 'full_name',
        section: 'grade_level',
        qr: 'qr_code',
        barcode: 'barcode',
        student_id: 'student_id',
        school_name: 'school_name',
        batch_name: 'batch_name',
        signature_line: 'signature_line',
      }
      const cfgKey = cfgKeyMap[key]
      if (!cfgKey) continue
      if (key === 'qr') {
        cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), size: Math.round(el.w) }
      } else if (key === 'barcode') {
        cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), width: Math.round(el.w), height: Math.round(el.h) }
      } else if (key === 'signature_line') {
        cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), width: Math.round(el.w) }
      } else {
        cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), font_size: el.fontSize ?? 16, color: el.color ?? '#000000' }
      }
    }
    formData.append('fields_config', JSON.stringify(cfg))

    try {
      await api.post(`/orders/${orderId}/layout/create/`, formData)
      setSaved(true)
      alert(`${side === 'FRONT' ? 'Front' : 'Back'} template published`)
    } catch {
      alert('Save failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!bgImage) return alert('Add a background image first.')
    setPreviewing(true)
    try {
      const photo = elements.photo ?? FIELD_DROP_DEFAULTS.photo
      const cfg: Record<string, any> = {}
      for (const key of activeFields) {
        if (key === 'photo') continue
        const el = elements[key]
        if (!el) continue
        const cfgKeyMap: Partial<Record<ElementKey, string>> = {
          name: 'full_name', section: 'grade_level', qr: 'qr_code',
          barcode: 'barcode', student_id: 'student_id', school_name: 'school_name',
          batch_name: 'batch_name', signature_line: 'signature_line',
        }
        const cfgKey = cfgKeyMap[key]
        if (!cfgKey) continue
        if (key === 'qr') cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), size: Math.round(el.w) }
        else if (key === 'barcode') cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), width: Math.round(el.w), height: Math.round(el.h) }
        else if (key === 'signature_line') cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), width: Math.round(el.w) }
        else cfg[cfgKey] = { x: Math.round(el.x), y: Math.round(el.y), font_size: el.fontSize ?? 16, color: el.color ?? '#000000' }
      }
      const res = await api.post(
        `/orders/${orderId}/layout/preview/`,
        { side, photo_x: Math.round(photo.x), photo_y: Math.round(photo.y), photo_width: Math.round(photo.w), photo_height: Math.round(photo.h), card_width: cardWidth, card_height: cardHeight, fields_config: cfg },
        { responseType: 'blob' },
      )
      setPreviewImage(URL.createObjectURL(res.data))
    } catch {
      alert('Preview failed — make sure at least one processed student exists for this order.')
    } finally {
      setPreviewing(false)
    }
  }

  return {
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
  }
}
