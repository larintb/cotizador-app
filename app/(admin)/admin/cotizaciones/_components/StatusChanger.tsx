'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
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
  const [isPending, startTransition] = useTransition()
  const [pending, setPending]        = useState<string | null>(null)

  const currentLabel = estatuses.find(e => e.value === currentStatus)?.label ?? currentStatus
  const pendingLabel = estatuses.find(e => e.value === pending)?.label ?? pending

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    setPending(newStatus)
  }

  const confirm = () => {
    if (!pending) return
    startTransition(() => {
      actualizarEstatus(id, pending)
    })
    setPending(null)
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

      {pending && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={cancel}
        >
          <div
            className="w-full max-w-sm"
            style={{ background: '#fff', border: '2px solid #000' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div style={{ background: '#000', height: '3px' }} />

            <div className="p-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>
                Confirmar cambio de estatus
              </p>
              <p className="font-black text-lg uppercase tracking-tight mb-6">
                {currentLabel} → {pendingLabel}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={confirm}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                  style={{ background: '#000' }}
                >
                  Confirmar
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
