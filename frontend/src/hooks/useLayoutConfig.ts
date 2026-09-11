import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'

export type ElementKey =
  | 'photo' | 'name' | 'section' | 'qr' | 'barcode'
  | 'student_id' | 'school_name' | 'batch_name' | 'signature_line'

export type LayoutSide = 'FRONT' | 'BACK'

interface UseLayoutConfigProps {
  orderId: number
  side?: LayoutSide   // defaults to FRONT
  onClose?: () => void
}

// Default element positions differ between front and back
const defaultElements = (side: LayoutSide) =>
  side === 'FRONT'
    ? {
        photo:          { x: 50,  y: 50,  w: 150, h: 200 },
        name:           { x: 50,  y: 270, w: 180, h: 30,  fontSize: 28, color: '#000000' },
        section:        { x: 50,  y: 310, w: 120, h: 25,  fontSize: 20, color: '#333333' },
        qr:             { x: 280, y: 480, w: 80,  h: 80  },
        barcode:        { x: 50,  y: 500, w: 200, h: 50  },
        student_id:     { x: 50,  y: 350, w: 160, h: 25,  fontSize: 18, color: '#000000' },
        school_name:    { x: 50,  y: 380, w: 200, h: 25,  fontSize: 18, color: '#000000' },
        batch_name:     { x: 50,  y: 410, w: 180, h: 25,  fontSize: 16, color: '#555555' },
        signature_line: { x: 50,  y: 600, w: 200, h: 20,  fontSize: 14, color: '#000000' },
      }
    : {
        // Back side defaults — no photo, barcode prominent, terms text
        photo:          { x: 10,  y: 10,  w: 0,   h: 0   },   // hidden on back by default
        name:           { x: 50,  y: 30,  w: 300, h: 25,  fontSize: 14, color: '#000000' },
        section:        { x: 50,  y: 60,  w: 200, h: 20,  fontSize: 12, color: '#333333' },
        qr:             { x: 260, y: 60,  w: 80,  h: 80  },
        barcode:        { x: 50,  y: 200, w: 250, h: 50  },
        student_id:     { x: 50,  y: 90,  w: 160, h: 20,  fontSize: 12, color: '#000000' },
        school_name:    { x: 50,  y: 10,  w: 200, h: 25,  fontSize: 16, color: '#000000' },
        batch_name:     { x: 50,  y: 115, w: 180, h: 20,  fontSize: 12, color: '#555555' },
        signature_line: { x: 50,  y: 280, w: 200, h: 20,  fontSize: 12, color: '#000000' },
      }

const defaultToggles = (side: LayoutSide) =>
  side === 'FRONT'
    ? {
        show_full_name:      true,
        show_student_id:     true,
        show_grade_level:    true,
        show_school_name:    true,
        show_school_year:    true,
        show_signature_line: false,
        show_qr_code:        true,
        show_barcode:        false,
      }
    : {
        show_full_name:      false,
        show_student_id:     true,
        show_grade_level:    false,
        show_school_name:    true,
        show_school_year:    false,
        show_signature_line: true,
        show_qr_code:        true,
        show_barcode:        true,
      }

export const useLayoutConfig = ({ orderId, side: sideProp, onClose: _onClose }: UseLayoutConfigProps) => {
  const side = sideProp ?? 'FRONT'
  const [bgImage,   setBgImage]   = useState<string | null>(null)
  const [bgFile,    setBgFile]    = useState<File | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementKey>('photo')
  const [previewImage,    setPreviewImage]    = useState<string | null>(null)
  const [previewing,      setPreviewing]      = useState(false)
  const [saved,     setSaved]     = useState(false)   // true once this side has a saved layout

  const [cardWidth,  setCardWidth]  = useState(638)
  const [cardHeight, setCardHeight] = useState(1012)
  const [zoom,       setZoom]       = useState(1)

  const [toggles, setToggles] = useState(defaultToggles(side))
  const [elements, setElements] = useState(defaultElements(side))

  const refs: Record<ElementKey, React.RefObject<any>> = {
    photo:          useRef(null),
    name:           useRef(null),
    section:        useRef(null),
    qr:             useRef(null),
    barcode:        useRef(null),
    student_id:     useRef(null),
    school_name:    useRef(null),
    batch_name:     useRef(null),
    signature_line: useRef(null),
  }

  const presets = [
    { label: 'Standard (638×1012)', width: 638, height: 1012 },
    { label: 'Compact (600×900)',   width: 600, height: 900  },
    { label: 'Wide (800×1000)',     width: 800, height: 1000 },
  ]

  // Load existing layout for this side from the API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/layout/`)
        // get_layout returns { FRONT: {...}, BACK: {...} }
        const layout = res.data[side]
        if (!layout) return

        setSaved(true)
        setCardWidth(layout.card_width   ?? 638)
        setCardHeight(layout.card_height ?? 1012)

        setToggles({
          show_full_name:      layout.show_full_name      ?? defaultToggles(side).show_full_name,
          show_student_id:     layout.show_student_id     ?? defaultToggles(side).show_student_id,
          show_grade_level:    layout.show_grade_level    ?? defaultToggles(side).show_grade_level,
          show_school_name:    layout.show_school_name    ?? defaultToggles(side).show_school_name,
          show_school_year:    layout.show_school_year    ?? defaultToggles(side).show_school_year,
          show_signature_line: layout.show_signature_line ?? defaultToggles(side).show_signature_line,
          show_qr_code:        layout.show_qr_code        ?? defaultToggles(side).show_qr_code,
          show_barcode:        layout.show_barcode        ?? defaultToggles(side).show_barcode,
        })

        // Photo placement
        setElements((prev) => ({
          ...prev,
          photo: {
            ...prev.photo,
            x: layout.photo_x      ?? prev.photo.x,
            y: layout.photo_y      ?? prev.photo.y,
            w: layout.photo_width  ?? prev.photo.w,
            h: layout.photo_height ?? prev.photo.h,
          },
        }))

        // Field placements from fields_config
        const cfg = layout.fields_config ?? {}
        setElements((prev) => ({
          ...prev,
          name:           cfg.full_name      ? { ...prev.name,           x: cfg.full_name.x,      y: cfg.full_name.y,      fontSize: cfg.full_name.font_size,      color: cfg.full_name.color      } : prev.name,
          section:        cfg.grade_level    ? { ...prev.section,        x: cfg.grade_level.x,    y: cfg.grade_level.y,    fontSize: cfg.grade_level.font_size,    color: cfg.grade_level.color    } : prev.section,
          qr:             cfg.qr_code        ? { ...prev.qr,             x: cfg.qr_code.x,        y: cfg.qr_code.y,        w: cfg.qr_code.size, h: cfg.qr_code.size                                } : prev.qr,
          barcode:        cfg.barcode        ? { ...prev.barcode,        x: cfg.barcode.x,        y: cfg.barcode.y,        w: cfg.barcode.width, h: cfg.barcode.height                             } : prev.barcode,
          student_id:     cfg.student_id     ? { ...prev.student_id,     x: cfg.student_id.x,     y: cfg.student_id.y,     fontSize: cfg.student_id.font_size,     color: cfg.student_id.color     } : prev.student_id,
          school_name:    cfg.school_name    ? { ...prev.school_name,    x: cfg.school_name.x,    y: cfg.school_name.y,    fontSize: cfg.school_name.font_size,    color: cfg.school_name.color    } : prev.school_name,
          batch_name:     cfg.batch_name     ? { ...prev.batch_name,     x: cfg.batch_name.x,     y: cfg.batch_name.y,     fontSize: cfg.batch_name.font_size,     color: cfg.batch_name.color     } : prev.batch_name,
          signature_line: cfg.signature_line ? { ...prev.signature_line, x: cfg.signature_line.x, y: cfg.signature_line.y                                                                          } : prev.signature_line,
        }))

        if (layout.background_image_url) setBgImage(layout.background_image_url)
      } catch { /* no existing layout — use defaults */ }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, side])

  const updateProp = (prop: string, value: any) => {
    setElements((prev) => ({ ...prev, [selectedElement]: { ...prev[selectedElement], [prop]: value } }))
  }

  const handleElementDrag = (key: ElementKey, x: number, y: number) => {
    setElements((prev) => ({ ...prev, [key]: { ...prev[key], x, y } }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setBgFile(file); setBgImage(URL.createObjectURL(file)) }
  }

  const saveLayout = async () => {
    if (!bgFile && !bgImage) return alert('Upload a background image first.')
    setLoading(true)

    const formData = new FormData()
    if (bgFile) formData.append('background_image', bgFile)
    formData.append('side',       side)
    formData.append('card_width',  cardWidth.toString())
    formData.append('card_height', cardHeight.toString())

    Object.entries(toggles).forEach(([k, v]) => formData.append(k, v.toString()))

    const cfg = {
      full_name:      { x: Math.round(elements.name.x),           y: Math.round(elements.name.y),           font_size: elements.name.fontSize,           color: elements.name.color           },
      grade_level:    { x: Math.round(elements.section.x),        y: Math.round(elements.section.y),        font_size: elements.section.fontSize,        color: elements.section.color        },
      qr_code:        { x: Math.round(elements.qr.x),             y: Math.round(elements.qr.y),             size: elements.qr.w                                                                },
      barcode:        { x: Math.round(elements.barcode.x),        y: Math.round(elements.barcode.y),        width: elements.barcode.w,                   height: elements.barcode.h           },
      student_id:     { x: Math.round(elements.student_id.x),     y: Math.round(elements.student_id.y),     font_size: elements.student_id.fontSize,     color: elements.student_id.color     },
      school_name:    { x: Math.round(elements.school_name.x),    y: Math.round(elements.school_name.y),    font_size: elements.school_name.fontSize,    color: elements.school_name.color    },
      batch_name:     { x: Math.round(elements.batch_name.x),     y: Math.round(elements.batch_name.y),     font_size: elements.batch_name.fontSize,     color: elements.batch_name.color     },
      signature_line: { x: Math.round(elements.signature_line.x), y: Math.round(elements.signature_line.y), width: elements.signature_line.w                                                  },
    }
    formData.append('photo_x',       Math.round(elements.photo.x).toString())
    formData.append('photo_y',       Math.round(elements.photo.y).toString())
    formData.append('photo_width',   Math.round(elements.photo.w).toString())
    formData.append('photo_height',  Math.round(elements.photo.h).toString())
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

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const res = await api.post(
        `/orders/${orderId}/layout/preview/`,
        {
          side,
          photo_x:      Math.round(elements.photo.x),
          photo_y:      Math.round(elements.photo.y),
          photo_width:  Math.round(elements.photo.w),
          photo_height: Math.round(elements.photo.h),
          card_width:   cardWidth,
          card_height:  cardHeight,
          fields_config: {
            full_name:      { x: Math.round(elements.name.x),        y: Math.round(elements.name.y),        font_size: elements.name.fontSize,    color: elements.name.color    },
            grade_level:    { x: Math.round(elements.section.x),     y: Math.round(elements.section.y),     font_size: elements.section.fontSize, color: elements.section.color },
            qr_code:        { x: Math.round(elements.qr.x),          y: Math.round(elements.qr.y),          size: elements.qr.w                                                 },
            barcode:        { x: Math.round(elements.barcode.x),     y: Math.round(elements.barcode.y),     width: elements.barcode.w,            height: elements.barcode.h   },
            student_id:     { x: Math.round(elements.student_id.x),  y: Math.round(elements.student_id.y),  font_size: elements.student_id.fontSize,  color: elements.student_id.color  },
            school_name:    { x: Math.round(elements.school_name.x), y: Math.round(elements.school_name.y), font_size: elements.school_name.fontSize, color: elements.school_name.color },
            batch_name:     { x: Math.round(elements.batch_name.x),  y: Math.round(elements.batch_name.y),  font_size: elements.batch_name.fontSize,  color: elements.batch_name.color  },
            signature_line: { x: Math.round(elements.signature_line.x), y: Math.round(elements.signature_line.y), width: elements.signature_line.w },
          },
        },
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
    updateProp, handleElementDrag, handleFileChange,
    saveLayout, handlePreview,
  }
}
