'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, CheckCircle, Banknote, Car, Calendar } from 'lucide-react'
import { buscarPorOrden } from '@/app/actions/cotizaciones'
import { fmt, redondear500, STATUS_LABELS, PROCESS_LABELS } from '@/lib/utils'

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.validacion
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold ${s.badge}`}>
      <span className={`w-2 h-2 flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

export default function ClienteDashboard() {
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cotizacion, setCotizacion] = useState<any>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim()) return

    setLoading(true)
    setError('')
    setCotizacion(null)

    const formatted = orderNumber.toUpperCase().trim()
    const result = await buscarPorOrden(formatted)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setCotizacion(result.cotizacion)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
          Buscar Cotización
        </h1>
        <p className="text-gray-500">
          Ingresa tu número de orden para consultar el estado de tu cotización.
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white border-2 border-gray-200 shadow-xl p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
              Número de Orden
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
                  setError('')
                  setCotizacion(null)
                }}
                placeholder="Ej. ABC-XYZ"
                maxLength={7}
                className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm font-bold uppercase tracking-widest bg-white transition-all duration-200"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading || orderNumber.length < 7}
                className="flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-[#10B981]"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Formato: 3 letras, guión, 3 letras (Ej. ABC-XYZ)
            </p>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-[#10B981] bg-emerald-50 mb-6 animate-fade-in">
          <AlertCircle size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#10B981]">{error}</p>
            <p className="text-xs text-emerald-400 mt-1">
              Verifica el número de orden e intenta nuevamente.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {cotizacion && (
        <div className="animate-fade-in">
          <div className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden">
            {/* Status header */}
            <div className="bg-black text-white p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Número de Orden
                </span>
                <StatusBadge status={cotizacion.status} />
              </div>
              <p className="font-black text-2xl tracking-widest">{cotizacion.order_number}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Vehículo */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-[#10B981]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
                    Vehículo
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Car size={16} className="text-gray-400" />
                    <p className="font-black text-lg text-black">
                      {(cotizacion.vehicle_data as Record<string, string>).year}{' '}
                      {(cotizacion.vehicle_data as Record<string, string>).make}{' '}
                      {(cotizacion.vehicle_data as Record<string, string>).model}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 font-mono pl-6">
                    VIN: {(cotizacion.vehicle_data as Record<string, string>).vin}
                  </p>
                </div>
              </div>

              {/* Proceso */}
              <div className="flex items-center justify-between p-4 border border-gray-200">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Tipo de Proceso
                </span>
                <span className="text-sm font-bold text-black">
                  {PROCESS_LABELS[cotizacion.selected_process as string] || cotizacion.selected_process}
                </span>
              </div>

              {/* Fecha */}
              <div className="flex items-center justify-between p-4 border border-gray-200">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Fecha de cotización
                </span>
                <span className="text-sm font-bold text-black">
                  {new Date(cotizacion.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Total */}
              <div className="border-2 border-[#10B981]">
                <div className="p-4 bg-white border-b border-[#10B981] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Total Estimado
                    </p>
                    <p className="text-xl font-black text-black">
                      {fmt((cotizacion.result as Record<string, number>).total)}
                    </p>
                  </div>
                  <Banknote size={28} className="text-gray-300" />
                </div>
                <div className="p-4 bg-[#10B981] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 text-white">
                      Total Redondeado
                    </p>
                    <p className="text-2xl font-black text-white">
                      {fmt(redondear500((cotizacion.result as Record<string, number>).total))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Esta cotización es de carácter{' '}
                  <span className="font-bold text-gray-700">informativo y referencial</span>. Los
                  montos finales pueden variar según el tipo de cambio vigente. Contacta a tu agente Arancela para más información.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      {!cotizacion && !error && (
        <div className="p-5 border border-gray-200 bg-white">
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-bold text-black">¿No tienes tu número de orden?</span>{' '}
            Contacta directamente a tu agente de Arancela para obtener tu número de seguimiento.
          </p>
        </div>
      )}
    </div>
  )
}
