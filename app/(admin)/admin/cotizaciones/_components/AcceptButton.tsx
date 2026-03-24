'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { aceptarCotizacion } from '@/app/actions/cotizaciones'

export default function AcceptButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    setLoading(true)
    setError('')
    const result = await aceptarCotizacion(id)
    setLoading(false)
    if ('error' in result) {
      setError(result.error ?? 'Error desconocido')
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10B981] border-2 border-[#10B981]">
        <CheckCircle size={12} /> Aceptada
      </span>
    )
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Aceptar
      </button>
      {error && <p className="text-[9px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}
