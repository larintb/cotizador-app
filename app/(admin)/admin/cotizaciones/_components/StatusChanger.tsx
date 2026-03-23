'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { actualizarEstatus } from '@/app/actions/cotizaciones'

interface Estatus {
  value: string
  label: string
  dot: string
  badge: string
  color: string
}

interface Props {
  id: string
  currentStatus: string
  estatuses: Estatus[]
}

export default function StatusChanger({ id, currentStatus, estatuses }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [pending, setPending]     = useState<string | null>(null)
  const [toast, setToast]         = useState(false)

  const currentIdx = estatuses.findIndex(e => e.value === currentStatus)
  const pendingIdx  = estatuses.findIndex(e => e.value === pending)
  const isGoingBack = pendingIdx !== -1 && pendingIdx < currentIdx

  const currentLabel = estatuses[currentIdx]?.label ?? currentStatus
  const pendingLabel  = estatuses[pendingIdx]?.label  ?? pending

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    setPending(newStatus)
  }

  const confirm = async () => {
    if (!pending) return
    setIsPending(true)
    await actualizarEstatus(id, pending, currentStatus)
    setIsPending(false)
    setPending(null)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const cancel = () => setPending(null)

  return (
    <>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="text-[10px] font-bold uppercase tracking-wide border-2 border-gray-200 bg-white px-2 py-1.5 outline-none focus:border-black transition-all duration-200 disabled:opacity-50 cursor-pointer"
      >
        {estatuses.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>

      {/* Toast */}
      {toast && createPortal(
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 shadow-lg"
          style={{ background: '#000', border: '1px solid #10B981', animation: 'fade-in 0.2s ease-out' }}
        >
          <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
          <span className="text-xs font-bold uppercase tracking-widest text-white">
            Estatus actualizado
          </span>
        </div>,
        document.body
      )}

      {/* Confirmation modal */}
      {pending && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={cancel}
        >
          <div
            className="w-full max-w-sm"
            style={{ background: '#fff', border: `2px solid ${isGoingBack ? '#EF4444' : '#000'}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div style={{ background: isGoingBack ? '#EF4444' : '#000', height: '3px' }} />

            <div className="p-8">
              {/* Backwards warning */}
              {isGoingBack && (
                <div
                  className="flex items-start gap-3 p-4 mb-6"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                >
                  <AlertTriangle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs font-bold" style={{ color: '#EF4444', lineHeight: 1.6 }}>
                    Estás retrocediendo el estatus. ¿Estás seguro de que deseas hacerlo?
                  </p>
                </div>
              )}

              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>
                Confirmar cambio de estatus
              </p>
              <p className="font-black text-lg uppercase tracking-tight mb-6">
                {currentLabel}
                <span style={{ color: isGoingBack ? '#EF4444' : '#10B981' }}> → </span>
                {pendingLabel}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={confirm}
                  disabled={isPending}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: isGoingBack ? '#EF4444' : '#000' }}
                >
                  {isPending ? 'Guardando...' : 'Confirmar'}
                </button>
                <button
                  onClick={cancel}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
                  style={{ background: '#f3f4f6', color: '#000' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
