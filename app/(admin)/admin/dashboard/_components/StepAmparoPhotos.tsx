'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle, Loader2, ChevronLeft, ArrowRight, AlertCircle, Upload } from 'lucide-react'
import { uploadAmparoPhoto } from '@/app/actions/storage'
import { createPortal } from 'react-dom'

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.onload = () => {
      try {
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
          else                { width = Math.round((width / height) * MAX);  height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          },
          'image/jpeg', 0.82
        )
      } catch { URL.revokeObjectURL(url); resolve(file) }
    }
    img.src = url
  })
}

const FOTO_SLOTS = [
  { id: 'frente',      label: 'Frente' },
  { id: 'trasera',     label: 'Trasera' },
  { id: 'lateral-der', label: 'Lateral Der.' },
  { id: 'lateral-izq', label: 'Lateral Izq.' },
  { id: 'interior',    label: 'Interior' },
  { id: 'motor',       label: 'Motor' },
  { id: 'vin-placa',   label: 'Placa VIN' },
]

interface Props {
  vin: string
  onNext: (urls: string[]) => void
  onBack: () => void
}

type SlotState = {
  file?: File
  localUrl?: string
  uploadStatus?: 'uploading' | 'done' | 'error'
  error?: string
}

export default function StepAmparoPhotos({ vin, onNext, onBack }: Props) {
  const [slots, setSlots] = useState<SlotState[]>(FOTO_SLOTS.map(() => ({})))
  const [uploading, setUploading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const allSelected = slots.every((s) => s.file != null)
  const selectedCount = slots.filter((s) => s.file != null).length

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) return
    // Liberar URL anterior si existe
    const prev = slots[index]
    if (prev.localUrl) URL.revokeObjectURL(prev.localUrl)
    const localUrl = URL.createObjectURL(file)
    setSlots((s) => {
      const next = [...s]
      next[index] = { file, localUrl }
      return next
    })
  }

  const uploadAll = async () => {
    setShowConfirm(false)
    setUploading(true)

    // Marcar todos como uploading
    setSlots((s) => s.map((slot) => ({ ...slot, uploadStatus: 'uploading' as const })))

    const results = await Promise.all(
      slots.map(async (slot, i) => {
        if (!slot.file) return { index: i, error: 'Sin archivo' }
        const compressed = await compressImage(slot.file)
        const path = `${vin}/${FOTO_SLOTS[i].id}-${Date.now()}.jpg`
        const formData = new FormData()
        formData.append('file', compressed)
        formData.append('path', path)
        const result = await uploadAmparoPhoto(formData)
        return { index: i, ...result }
      })
    )

    let allOk = true
    setSlots((prev) => {
      const next = [...prev]
      results.forEach((r) => {
        if ('error' in r) {
          allOk = false
          next[r.index] = {
            ...next[r.index],
            uploadStatus: 'error',
            error: (r.error ?? '').length > 60 ? (r.error ?? '').slice(0, 60) + '…' : (r.error ?? 'Error'),
          }
        } else {
          next[r.index] = { ...next[r.index], uploadStatus: 'done', error: undefined }
        }
      })
      return next
    })

    setUploading(false)

    if (allOk) {
      const urls = results.map((r) => ('url' in r ? r.url : ''))
      onNext(urls)
    }
  }

  return (
    <div className="animate-slide-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Camera size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Evidencia Fotográfica</h2>
          <p className="text-sm text-gray-500 mt-0.5">Selecciona las 7 fotos — se subirán al confirmar</p>
        </div>
      </div>

      {/* Progreso */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {selectedCount} de {FOTO_SLOTS.length} seleccionadas
        </span>
        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 ${
          allSelected ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {allSelected ? 'Listo para subir' : 'Pendiente'}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-200 mb-6">
        <div
          className="h-full bg-[#10B981] transition-all duration-500"
          style={{ width: `${(selectedCount / FOTO_SLOTS.length) * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {FOTO_SLOTS.map((slot, i) => {
          const state = slots[i]
          const isUploading = state.uploadStatus === 'uploading'
          const isError = state.uploadStatus === 'error'
          return (
            <div key={slot.id}>
              <input
                ref={(el) => { inputRefs.current[i] = el }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleFileSelect(i, e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => !uploading && inputRefs.current[i]?.click()}
                disabled={uploading}
                className={`relative w-full overflow-hidden border-2 transition-all duration-200 ${
                  isError
                    ? 'border-red-400'
                    : state.file
                    ? 'border-[#10B981]'
                    : 'border-gray-200 hover:border-gray-400'
                } ${uploading ? 'cursor-wait' : ''}`}
                style={{ aspectRatio: '4/3' }}
              >
                {state.localUrl ? (
                  <>
                    <img src={state.localUrl} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-end p-2">
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}
                      {isError && (
                        <div className="absolute top-1 right-1">
                          <AlertCircle size={16} className="text-red-400" />
                        </div>
                      )}
                      {state.uploadStatus === 'done' && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle size={16} className="text-[#10B981]" />
                        </div>
                      )}
                      <p className="relative text-[11px] font-bold text-white">{slot.label}</p>
                      {isError && <p className="text-[9px] text-red-300 leading-tight">{state.error}</p>}
                      {!isUploading && !isError && (
                        <p className="text-[9px] text-white/70">Toca para cambiar</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-2">
                    <Camera size={24} className="text-gray-300" />
                    <p className="text-[11px] font-bold text-gray-600">{slot.label}</p>
                    <p className="text-[9px] text-gray-400">Toca para seleccionar</p>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="p-4 border border-gray-200 bg-gray-50 mb-6">
        <p className="text-xs text-gray-500 leading-relaxed">
          Selecciona todas las fotos y verifica que se vean bien antes de confirmar.
          Las fotos se subirán al dar clic en Confirmar.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-4 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-widest hover:border-black hover:text-black transition-all duration-200 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Regresar
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!allSelected || uploading}
          className={`flex-1 flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
            allSelected && !uploading
              ? 'bg-black text-white hover:bg-[#10B981]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
          ) : (
            <>Confirmar fotos <ArrowRight size={18} /></>
          )}
        </button>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white border-2 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black h-1" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Upload size={20} className="text-[#10B981] flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Confirmar subida
                </p>
              </div>
              <p className="font-black text-lg uppercase tracking-tight mb-2">
                ¿Las fotos están correctas?
              </p>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Se subirán las {FOTO_SLOTS.length} fotos al servidor. Verifica que todas muestren claramente la parte del vehículo indicada.
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-6">
                {slots.map((s, i) => s.localUrl && (
                  <img key={i} src={s.localUrl} alt="" className="w-full aspect-square object-cover" />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={uploadAll}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-black hover:bg-[#10B981] transition-colors"
                >
                  Sí, subir
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest bg-gray-100 text-black hover:bg-gray-200 transition-colors"
                >
                  Revisar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
