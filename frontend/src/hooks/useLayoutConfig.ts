import { useState, useEffect, useRef} from 'react'
import api from '../utils/api'

export type ElementKey = 'photo' | 'name' | 'section' | 'qr' | 'barcode' | 
                         'student_id' | 'school_name' | 'batch_name' | 'signature_line'
                         
interface UseLayoutConfigProps {
    orderId: number 
    onClose: () => void;
}

export const useLayoutConfig = ({ orderId, onClose }: UseLayoutConfigProps) => {
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedElement, setSelectedElement] = useState<ElementKey>('photo');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);

    const [cardWidth, setCardWidth] = useState(638);
    const [cardHeight, setCardHeight] = useState(1012);
    const [zoom, setZoom] = useState(1);

    const [toggles, setToggles] = useState({
        show_full_name: true,
        show_student_id: true,
        show_grade_level: true,
        show_school_name: true,
        show_school_year: true,
        show_signature_line: false,
        show_qr_code: true,
        show_barcode: false,
    })

    const refs: Record<ElementKey, React.RefObject<any>> = {
        photo: useRef(null), name: useRef(null), section: useRef(null),
        qr: useRef(null), barcode: useRef(null),
        student_id: useRef(null), school_name: useRef(null),
        batch_name: useRef(null), signature_line: useRef(null),
    }

    const [elements, setElements] = useState({
        photo: { x: 50,  y: 50,  w: 150, h: 200 },
        name:  { x: 50,  y: 270, w: 180, h: 30,  fontSize: 28, color: '#000000' },
        section: { x: 50,  y: 310, w: 120, h: 25,  fontSize: 20, color: '#333333' },
        qr: { x: 280, y: 480, w: 80,  h: 80 },
        barcode: { x: 50,  y: 500, w: 200, h: 50 },
        student_id: { x: 50,  y: 350, w: 160, h: 25,  fontSize: 18, color: '#000000' },
        school_name: { x: 50,  y: 380, w: 200, h: 25,  fontSize: 18, color: '#000000' },
        batch_name: { x: 50,  y: 410, w: 180, h: 25,  fontSize: 16, color: '#555555' },
        signature_line: { x: 50,  y: 600, w: 200, h: 20,  fontSize: 14, color: '#000000' },
    })

    const presets = [
        { label: 'Standard (638x1012)', width: 638, height: 1012 },
        { label: 'Compact (600x900)',   width: 600, height: 900  },
        { label: 'Wide (800x1000)',     width: 800, height: 1000 },
    ]

    useEffect(() => {
        const loadLayout = async () => {
            try {
                const res = await api.get(`/orders/${orderId}/layout/`)
                const layout = res.data

                if (!layout) return 

                setCardWidth(layout.card_width ?? 638)
                setCardHeight(layout.card_height ?? 1012)

                setToggles({
                    show_full_name:      layout.show_full_name      ?? true,
                    show_student_id:     layout.show_student_id     ?? true,
                    show_grade_level:    layout.show_grade_level    ?? true,
                    show_school_name:    layout.show_school_name    ?? true,
                    show_school_year:    layout.show_school_year    ?? true,
                    show_signature_line: layout.show_signature_line ?? false,
                    show_qr_code:        layout.show_qr_code        ?? true,
                    show_barcode:        layout.show_barcode        ?? false,
                })

                setElements(prev => ({
                    ...prev,
                    photo: {
                        ...prev.photo,
                        x: layout.photo_x ?? prev.photo.x,
                        y: layout.photo_y ?? prev.photo.y,
                        w: layout.photo_width  ?? prev.photo.w,
                        h: layout.photo_height ?? prev.photo.h,
                    }
                }))

                const cfg = layout.fields_config ?? {}

                setElements(prev => ({
                    ...prev,
                    name:           cfg.full_name    ? { ...prev.name,           x: cfg.full_name.x,    y: cfg.full_name.y,    fontSize: cfg.full_name.font_size,    color: cfg.full_name.color    } : prev.name,
                    section:        cfg.grade_level  ? { ...prev.section,        x: cfg.grade_level.x,  y: cfg.grade_level.y,  fontSize: cfg.grade_level.font_size,  color: cfg.grade_level.color  } : prev.section,
                    qr:             cfg.qr_code      ? { ...prev.qr,             x: cfg.qr_code.x,      y: cfg.qr_code.y,      w: cfg.qr_code.size, h: cfg.qr_code.size                             } : prev.qr,
                    barcode:        cfg.barcode      ? { ...prev.barcode,        x: cfg.barcode.x,      y: cfg.barcode.y,      w: cfg.barcode.width, h: cfg.barcode.height                          } : prev.barcode,
                    student_id:     cfg.student_id   ? { ...prev.student_id,     x: cfg.student_id.x,   y: cfg.student_id.y,   fontSize: cfg.student_id.font_size,   color: cfg.student_id.color   } : prev.student_id,
                    school_name:    cfg.school_name  ? { ...prev.school_name,    x: cfg.school_name.x,  y: cfg.school_name.y,  fontSize: cfg.school_name.font_size,  color: cfg.school_name.color  } : prev.school_name,
                    batch_name:     cfg.batch_name   ? { ...prev.batch_name,     x: cfg.batch_name.x,   y: cfg.batch_name.y,   fontSize: cfg.batch_name.font_size,   color: cfg.batch_name.color   } : prev.batch_name,
                    signature_line: cfg.signature_line ? { ...prev.signature_line, x: cfg.signature_line.x, y: cfg.signature_line.y } : prev.signature_line,
                }));

                if (layout.background_image) {
                    setBgImage(`/media/${layout.background_image}`);
                }

            } catch (err: any) {

            }
        }
        loadLayout()
    }, [orderId])

    const updateProp = (prop: string, value: any) => {
        setElements(prev => ({ ...prev, [selectedElement]: { ...prev[selectedElement], [prop]: value } }));
    }

    const handleElementDrag = (key: ElementKey, x: number, y: number) => {
        setElements(prev => ({ ...prev, [key]: { ...prev[key], x, y } }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBgFile(file)
            setBgImage(URL.createObjectURL(file))
        }
    }

    const saveLayout = async () => {
        if (!bgFile && !bgImage) return alert("Upload background first.");
        setLoading(true);

        const formData = new FormData()
        if (bgFile) formData.append('background_image', bgFile)
        formData.append('card_width',  cardWidth.toString())
        formData.append('card_height', cardHeight.toString())

        Object.entries(toggles).forEach(([key, val])=> {
            formData.append(key, val.toString());
        })

        const configForPython = {
            full_name:      { x: Math.round(elements.name.x),           y: Math.round(elements.name.y),           font_size: elements.name.fontSize,           color: elements.name.color           },
            grade_level:    { x: Math.round(elements.section.x),        y: Math.round(elements.section.y),        font_size: elements.section.fontSize,        color: elements.section.color        },
            qr_code:        { x: Math.round(elements.qr.x),             y: Math.round(elements.qr.y),             size: elements.qr.w                                                               },
            barcode:        { x: Math.round(elements.barcode.x),        y: Math.round(elements.barcode.y),        width: elements.barcode.w,                   height: elements.barcode.h           },
            student_id:     { x: Math.round(elements.student_id.x),     y: Math.round(elements.student_id.y),     font_size: elements.student_id.fontSize,     color: elements.student_id.color     },
            school_name:    { x: Math.round(elements.school_name.x),    y: Math.round(elements.school_name.y),    font_size: elements.school_name.fontSize,    color: elements.school_name.color    },
            batch_name:     { x: Math.round(elements.batch_name.x),     y: Math.round(elements.batch_name.y),     font_size: elements.batch_name.fontSize,     color: elements.batch_name.color     },
            signature_line: { x: Math.round(elements.signature_line.x), y: Math.round(elements.signature_line.y), width: elements.signature_line.w                                                  },
        };

        formData.append('photo_x',      Math.round(elements.photo.x).toString());
        formData.append('photo_y',      Math.round(elements.photo.y).toString());
        formData.append('photo_width',  Math.round(elements.photo.w).toString());
        formData.append('photo_height', Math.round(elements.photo.h).toString());
        formData.append('fields_config', JSON.stringify(configForPython));

        try {
            await api.post(`/orders/${orderId}/layout/create/`, formData)
            alert('Template Published')
            onClose()
        } catch (err) {
            alert("Save failed");
        } finally {
            setLoading(false)
        }
    }

    const handlePreview = async () => {
        setPreviewing(true);
        try {
        const res = await api.post(`/orders/${orderId}/layout/preview/`, {
            photo_x:      Math.round(elements.photo.x),
            photo_y:      Math.round(elements.photo.y),
            photo_width:  Math.round(elements.photo.w),
            photo_height: Math.round(elements.photo.h),
            card_width:   cardWidth,
            card_height:  cardHeight,
            fields_config: {
            full_name:      { x: Math.round(elements.name.x),       y: Math.round(elements.name.y),       font_size: elements.name.fontSize,    color: elements.name.color    },
            grade_level:    { x: Math.round(elements.section.x),    y: Math.round(elements.section.y),    font_size: elements.section.fontSize, color: elements.section.color },
            qr_code:        { x: Math.round(elements.qr.x),         y: Math.round(elements.qr.y),         size: elements.qr.w                                                 },
            barcode:        { x: Math.round(elements.barcode.x),    y: Math.round(elements.barcode.y),    width: elements.barcode.w,            height: elements.barcode.h   },
            student_id:     { x: Math.round(elements.student_id.x), y: Math.round(elements.student_id.y), font_size: elements.student_id.fontSize, color: elements.student_id.color },
            school_name:    { x: Math.round(elements.school_name.x),y: Math.round(elements.school_name.y),font_size: elements.school_name.fontSize,color: elements.school_name.color },
            batch_name:     { x: Math.round(elements.batch_name.x), y: Math.round(elements.batch_name.y), font_size: elements.batch_name.fontSize, color: elements.batch_name.color },
            signature_line: { x: Math.round(elements.signature_line.x), y: Math.round(elements.signature_line.y), width: elements.signature_line.w },
            }
        }, { responseType: 'blob' });
        setPreviewImage(URL.createObjectURL(res.data));
        } catch {
        alert('Preview failed — make sure at least one processed student exists for this order.');
        } finally {
        setPreviewing(false);
        }
    };

    return {
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
  };
}