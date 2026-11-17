import { useState, useEffect, useRef, useCallback, createRef } from 'react'
import api from '../utils/api'

type BuiltInElementKey =
  | 'photo' | 'name' | 'section' | 'qr' | 'barcode'
  | 'student_id' | 'school_name' | 'batch_name' | 'signature_line'

export type ElementKey = BuiltInElementKey | `extra:${string}`

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
const FIELD_DROP_DEFAULTS: Record<string, ElementProps> = {
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

const FIELD_KEYS: Partial<Record<ElementKey, string>> = {
  name: 'full_name', section: 'grade_level', qr: 'qr_code', barcode: 'barcode',
  student_id: 'student_id', school_name: 'school_name', batch_name: 'batch_name',
  signature_line: 'signature_line',
}

const fieldDefaults = (key: ElementKey) => FIELD_DROP_DEFAULTS[key] ?? FIELD_DROP_DEFAULTS.name

export const isLayoutTextField = (key: ElementKey) =>
  !['photo', 'qr', 'barcode', 'signature_line'].includes(key)

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

function layoutForm(side: LayoutSide, { bgFile, cardWidth, cardHeight, toggles, elements, activeFields }: SideState) {
  const form = new FormData()
  if (bgFile) form.append('background_image', bgFile)
  form.append('side', side)
  form.append('card_width', String(Math.round(cardWidth)))
  form.append('card_height', String(Math.round(cardHeight)))
  for (const [key, value] of Object.entries(toggles)) form.append(key, String(value))

  const photo = elements.photo ?? fieldDefaults('photo')
  form.append('show_photo', String(activeFields.includes('photo')))
  form.append('photo_x', String(Math.round(photo.x)))
  form.append('photo_y', String(Math.round(photo.y)))
  form.append('photo_width', String(Math.round(photo.w)))
  form.append('photo_height', String(Math.round(photo.h)))

  const config: Record<string, Record<string, string | number>> = {}
  for (const key of activeFields) {
    const element = elements[key]
    if (key === 'photo' || !element) continue
    const position = {
      x: Math.round(element.x), y: Math.round(element.y),
      width: Math.round(element.w), height: Math.round(element.h),
    }
    const fieldKey = FIELD_KEYS[key] ?? key
    if (key === 'qr') {
      config[fieldKey] = { ...position, size: position.width }
    } else if (isLayoutTextField(key)) {
      config[fieldKey] = {
        ...position,
        font_size: Math.round(element.fontSize ?? 16),
        color: element.color ?? '#000000',
        text_anchor: 'top_left',
      }
    } else {
      config[fieldKey] = position
    }
  }
  form.append('fields_config', JSON.stringify(config))
  return form
}

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
      const setSideState = side === 'FRONT' ? setFrontState : setBackState
      setSideState(previous => ({
        ...(typeof updater === 'function' ? updater(previous) : updater),
        saved: false,
      }))
    },
    [side],
  )

  // Convenience accessors
  const bgImage = current.bgImage
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
  const setCardWidth = (v: number) => setCurrent((p) => ({ ...p, cardWidth: v }))
  const setCardHeight = (v: number) => setCurrent((p) => ({ ...p, cardHeight: v }))

  const [loading, setLoading] = useState(false)
  const [loadingLayouts, setLoadingLayouts] = useState(true)
  const [layoutLoadError, setLayoutLoadError] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementKey | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const previewRequestId = useRef(0)

  useEffect(() => {
    if (!previewImage) return
    return () => URL.revokeObjectURL(previewImage)
  }, [previewImage])

  useEffect(() => {
    setPreviewImage(null)
    setPreviewing(false)
    setSelectedElement(null)
    return () => {
      // Ignore responses from a previous side/order or an unmounted editor.
      previewRequestId.current += 1
    }
  }, [orderId, side])
  const [zoom, setZoom] = useState(1)

  const refs = useRef(new Map<ElementKey, React.RefObject<HTMLDivElement | null>>())
  const getElementRef = (key: ElementKey) => {
    const existing = refs.current.get(key)
    if (existing) return existing
    const ref = createRef<HTMLDivElement>()
    refs.current.set(key, ref)
    return ref
  }

  const [importedFields, setImportedFields] = useState<ElementKey[]>([])
  const [fieldLoadError, setFieldLoadError] = useState(false)
  useEffect(() => {
    let cancelled = false
    setImportedFields([])
    setFieldLoadError(false)
    api.get<{ extra_data?: Record<string, unknown> }[]>(`/orders/${orderId}/students/`)
      .then(({ data }) => {
        if (cancelled) return
        const keys = new Set(data.flatMap(subject => Object.keys(subject.extra_data ?? {})))
        setImportedFields(Array.from(keys, key => `extra:${key}` as const))
      })
      .catch(() => { if (!cancelled) setFieldLoadError(true) })
    return () => { cancelled = true }
  }, [orderId])

  const presets = [
    { label: 'Standard (638×1012)', width: 638, height: 1012 },
    { label: 'Compact (600×900)', width: 600, height: 900 },
    { label: 'Wide (800×1000)', width: 800, height: 1000 },
  ]

  useEffect(() => {
    let cancelled = false
    setLoadingLayouts(true)
    setLayoutLoadError(false)
    setFrontState(initSideState('FRONT'))
    setBackState(initSideState('BACK'))

    api.get(`/orders/${orderId}/layout/`)
      .then(({ data }) => {
        if (cancelled) return
        for (const layoutSide of ['FRONT', 'BACK'] as const) {
          const layout = data[layoutSide]
          if (!layout) continue
          const draft = initSideState(layoutSide)
          draft.saved = true
          draft.cardWidth = layout.card_width
          draft.cardHeight = layout.card_height
          draft.bgImage = layout.background_image_url
          if (layout.show_photo ?? (layout.photo_width > 0 && layout.photo_height > 0)) {
            draft.activeFields.push('photo')
            draft.elements.photo = {
              x: layout.photo_x, y: layout.photo_y, w: layout.photo_width, h: layout.photo_height,
            }
          }
          const config = layout.fields_config as Record<string, Record<string, number | string>> | undefined
          for (const [fieldKey, field] of Object.entries(config ?? {})) {
            const builtIn = Object.entries(FIELD_KEYS).find(([, value]) => value === fieldKey)?.[0]
            const key = (builtIn ?? (fieldKey.startsWith('extra:') ? fieldKey : `extra:${fieldKey}`)) as ElementKey
            const defaults = fieldDefaults(key)
            draft.activeFields.push(key)
            draft.elements[key] = {
              x: Number(field.x ?? defaults.x), y: Number(field.y ?? defaults.y),
              w: Number(field.width ?? field.size ?? defaults.w),
              h: Number(field.height ?? field.size ?? defaults.h),
              fontSize: Number(field.font_size ?? defaults.fontSize ?? 16),
              color: String(field.color ?? defaults.color ?? '#000000'),
            }
          }
          for (const key of Object.keys(draft.toggles) as (keyof SideState['toggles'])[]) {
            draft.toggles[key] = layout[key] ?? draft.toggles[key]
          }
          if (layoutSide === 'FRONT') setFrontState(draft)
          else setBackState(draft)
        }
      })
      .catch(error => {
        if (!cancelled && error.response?.status !== 404) setLayoutLoadError(true)
      })
      .finally(() => { if (!cancelled) setLoadingLayouts(false) })

    return () => { cancelled = true }
  }, [orderId])

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
        [key]: fieldDefaults(key),
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
      [selectedElement]: { ...(prev[selectedElement] ?? fieldDefaults(selectedElement)), [prop]: value },
    }))
  }, [selectedElement, setElements])

  // ── Patch an element directly by key (used by resize handler) ─────────────
  const patchElement = useCallback((key: ElementKey, patch: Partial<ElementProps>) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? fieldDefaults(key)), ...patch },
    }))
  }, [setElements])

  const handleElementDrag = useCallback((key: ElementKey, x: number, y: number) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? fieldDefaults(key)), x, y },
    }))
  }, [setElements])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setBgFile(file); setBgImage(URL.createObjectURL(file)) }
  }

  const saveSide = async (layoutSide: LayoutSide, draft: SideState) => {
    const { data } = await api.post(`/orders/${orderId}/layout/create/`, layoutForm(layoutSide, draft))
    const setSideState = layoutSide === 'FRONT' ? setFrontState : setBackState
    setSideState(previous => {
      if (previous !== draft) return previous
      return {
        ...previous,
        saved: true,
        bgImage: data.background_image_url ?? previous.bgImage,
        bgFile: data.background_image_url ? null : previous.bgFile,
      }
    })
  }

  const publish = async (drafts: [LayoutSide, SideState][]) => {
    if (loading || loadingLayouts || layoutLoadError) return
    const configured = drafts.filter(([, draft]) => draft.bgImage || draft.bgFile)
    if (!configured.length) {
      alert('Upload a background image first.')
      return
    }

    setLoading(true)
    const published: string[] = []
    const failures: string[] = []
    try {
      for (const [layoutSide, draft] of configured) {
        const label = layoutSide === 'FRONT' ? 'Front' : 'Back'
        try {
          await saveSide(layoutSide, draft)
          published.push(label)
        } catch (error) {
          const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error
          failures.push(`${label}: ${message ?? 'Save failed'}`)
        }
      }
      alert([
        published.length && `Published: ${published.join(', ')}.`,
        failures.length && failures.join('\n'),
      ].filter(Boolean).join('\n'))
    } finally {
      setLoading(false)
    }
  }

  const saveLayout = () => publish([[side, current]])
  const publishLayouts = () => publish([['FRONT', frontState], ['BACK', backState]])

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!bgImage) {
      alert('Add a background image first.')
      return
    }

    const requestId = ++previewRequestId.current
    setPreviewing(true)

    try {
      const response = await api.post(
        `/orders/${orderId}/layout/preview/`,
        layoutForm(side, current),
        { responseType: 'blob' },
      )

      if (requestId !== previewRequestId.current) return
      setPreviewImage(URL.createObjectURL(response.data))
    } catch (error: unknown) {
      if (requestId !== previewRequestId.current) return
      const response = (
        error as { response?: { data?: unknown } }
      ).response

      let details = response?.data

      if (details instanceof Blob) {
        const text = await details.text()

        try {
          details = JSON.parse(text)
        } catch {
          details = null
        }
      }

      let message = 'Could not render the preview. Please try again.'

      if (details && typeof details === 'object') {
        const body = details as Record<string, unknown>

        if (typeof body.error === 'string') {
          message = body.error
        } else if (typeof body.detail === 'string') {
          message = body.detail
        } else {
          // Includes serializer errors such as invalid dimensions.
          message = JSON.stringify(body)
        }
      }

      if (requestId === previewRequestId.current) alert(message)
    } finally {
      if (requestId === previewRequestId.current) setPreviewing(false)
    }
  }

  return {
    bgImage, loading, loadingLayouts, layoutLoadError, saved,
    selectedElement, setSelectedElement,
    previewImage, setPreviewImage, previewing,
    cardWidth, setCardWidth,
    cardHeight, setCardHeight,
    zoom, setZoom,
    toggles, setToggles,
    elements, getElementRef, presets, importedFields, fieldLoadError,
    activeFields,
    addField, removeField,
    updateProp, handleElementDrag, handleFileChange,
    patchElement,
    saveLayout, publishLayouts, handlePreview,
  }
}
