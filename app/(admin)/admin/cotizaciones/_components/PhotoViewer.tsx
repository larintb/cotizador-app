'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Images, X, ExternalLink } from 'lucide-react'

const SLOT_LABELS = ['Frente', 'Trasera', 'Lateral Der.', 'Lateral Izq.', 'Interior', 'Motor', 'Placa VIN']

export default function PhotoViewer({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  if (!urls || urls.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1.5 border-2 border-gray-200 text-gray-600 hover:border-black hover:text-black transition-all duration-200 text-[10px] font-bold uppercase tracking-widest"
      >
        <Images size={12} />
        Ver fotos ({urls.length})
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setOpen(false); setSelected(null) }}
        >
          <div
            className="w-full max-w-3xl bg-white border-2 border-black max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Images size={16} className="text-[#10B981]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Evidencia Fotográfica — {urls.length}/7 fotos
                </span>
              </div>
              <button
                onClick={() => { setOpen(false); setSelected(null) }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Foto ampliada */}
            {selected !== null && (
              <div className="relative bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urls[selected]}
                  alt={SLOT_LABELS[selected] ?? `Foto ${selected + 1}`}
                  className="w-full max-h-96 object-contain"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-between px-4 py-2">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    {SLOT_LABELS[selected] ?? `Foto ${selected + 1}`}
                  </span>
                  <a
                    href={urls[selected]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-white/70 hover:text-white"
                  >
                    <ExternalLink size={11} /> Abrir original
                  </a>
                </div>
              </div>
            )}

            {/* Grid de thumbnails */}
            <div className="p-4 grid grid-cols-4 gap-2">
              {urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={`relative overflow-hidden border-2 transition-all duration-150 ${
                    selected === i ? 'border-[#10B981]' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ aspectRatio: '4/3' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={SLOT_LABELS[i] ?? `Foto ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 py-0.5">
                    <p className="text-[9px] font-bold text-white text-center">
                      {SLOT_LABELS[i] ?? `Foto ${i + 1}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
