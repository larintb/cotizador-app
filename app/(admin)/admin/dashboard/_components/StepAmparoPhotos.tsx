'use client'

import { useState, useRef } from 'react'
import { Camera, ChevronLeft, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  onNext: (files: File[]) => void
  onBack: () => void
}

type SlotState = { file?: File; localUrl?: string }

export default function StepAmparoPhotos({ onNext, onBack }: Props) {
  const [slots, setSlots] = useState<SlotState[]>(FOTO_SLOTS.map(() => ({})))
  const [showConfirm, setShowConfirm] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const allSelected = slots.every((s) => s.file != null)
  const selectedCount = slots.filter((s) => s.file != null).length

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) return
    const prev = slots[index]
    if (prev.localUrl) URL.revokeObjectURL(prev.localUrl)
    const localUrl = URL.createObjectURL(file)
    setSlots((s) => {
      const next = [...s]
      next[index] = { file, localUrl }
      return next
    })
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onNext(slots.map((s) => s.file!))
  }

  return (
    <div className="animate-slide-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Camera size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Evidencia Fotográfica</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Selecciona las 7 fotos — se subirán al confirmar la solicitud
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {selectedCount} de {FOTO_SLOTS.length} seleccionadas
        </span>
        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 ${
          allSelected ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {allSelected ? 'Listas para confirmar' : 'Pendiente'}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-200 mb-6">
        <div
          className="h-full bg-[#10B981] transition-all duration-500"
          style={{ width: `${(selectedCount / FOTO_SLOTS.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {FOTO_SLOTS.map((slot, i) => {
          const state = slots[i]
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
                onClick={() => inputRefs.current[i]?.click()}
                className={`relative w-full overflow-hidden border-2 transition-all duration-200 ${
                  state.file ? 'border-[#10B981]' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ aspectRatio: '4/3' }}
              >
                {state.localUrl ? (
                  <>
                    <img
                      src={state.localUrl}
                      alt={slot.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-end justify-end p-2">
                      <p className="text-[11px] font-bold text-white w-full text-center">{slot.label}</p>
                      <p className="text-[9px] text-white/70 w-full text-center">Toca para cambiar</p>
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
          Verifica que todas las fotos se vean bien antes de continuar.
          Las fotos se subirán únicamente cuando confirmes la solicitud con tu agente.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-4 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-widest hover:border-black hover:text-black transition-all duration-200"
        >
          <ChevronLeft size={16} />
          Regresar
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!allSelected}
          className={`flex-1 flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
            allSelected
              ? 'bg-black text-white hover:bg-[#10B981]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar <ArrowRight size={18} />
        </button>
      </div>

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
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Verificar fotos
              </p>
              <p className="font-black text-lg uppercase tracking-tight mb-4">
                ¿Las fotos están correctas?
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-6">
                {slots.map((s, i) => s.localUrl ? (
                  <img key={i} src={s.localUrl} alt="" className="w-full aspect-square object-cover" />
                ) : null)}
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Las fotos se subirán cuando confirmes la solicitud con tu agente en el siguiente paso.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-black hover:bg-[#10B981] transition-colors"
                >
                  Sí, continuar
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
