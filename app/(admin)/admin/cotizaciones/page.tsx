import { obtenerCotizacionesPropias } from '@/app/actions/cotizaciones'
import { fmt, redondear500, ESTATUSES, STATUS_LABELS, PROCESS_LABELS } from '@/lib/utils'
import { ClipboardList, Calendar, FileText, User, Clock } from 'lucide-react'
import StatusChanger from './_components/StatusChanger'
import AcceptButton from './_components/AcceptButton'
import PhotoViewer from './_components/PhotoViewer'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.validacion
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

export default async function CotizacionesPage() {
  const { cotizaciones, error } = await obtenerCotizacionesPropias()

  const pending = (cotizaciones ?? []).filter((c: Record<string, unknown>) => c.status === 'pendiente')
  const active  = (cotizaciones ?? []).filter((c: Record<string, unknown>) => c.status !== 'pendiente')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-black flex items-center justify-center">
          <ClipboardList size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Historial de Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} cotización{active.length !== 1 ? 'es' : ''} activa{active.length !== 1 ? 's' : ''}
            {pending.length > 0 && ` · ${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 border-l-4 border-red-400 bg-red-50 mb-6">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* ── Solicitudes Pendientes ──────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-yellow-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-yellow-700">
              Solicitudes Pendientes de Aprobación
            </h2>
            <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5">
              {pending.length}
            </span>
          </div>

          <div className="border-2 border-yellow-300 bg-yellow-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-yellow-400 text-yellow-900">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"># Orden</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Vehículo</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden sm:table-cell">Fotos</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden sm:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-200">
                  {pending.map((cot: Record<string, unknown>) => {
                    const v = cot.vehicle_data as Record<string, string>
                    const photos = (cot.photo_urls as string[] | null) ?? []
                    return (
                      <tr key={cot.id as string} className="hover:bg-yellow-100 transition-colors">
                        <td className="px-4 py-4">
                          <span className="font-black text-sm tracking-widest text-black">
                            {cot.order_number as string}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-sm text-black">{v.year} {v.make} {v.model}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{v.vin}</p>
                          {cot.client_email ? (
                            <p className="text-xs text-gray-500 mt-0.5">{cot.client_email as string}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <PhotoViewer urls={photos} />
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Calendar size={11} />
                            {fmtDate(cot.created_at as string)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <AcceptButton id={cot.id as string} vehicleData={v} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Historial Activo ────────────────────────────────────────────── */}
      {(!cotizaciones || cotizaciones.length === 0) && !error && (
        <div className="bg-white border-2 border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-sm">
            Sin cotizaciones guardadas
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Las cotizaciones que guardes aparecerán aquí
          </p>
        </div>
      )}

      {active.length > 0 && (
        <div className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"># Orden</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Vehículo</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden md:table-cell">Proceso</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Estatus</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {active.map((cot: Record<string, unknown>) => {
                  const v = cot.vehicle_data as Record<string, string>
                  const r = cot.result as Record<string, number> | null
                  const photos = (cot.photo_urls as string[] | null) ?? []
                  return (
                    <tr key={cot.id as string} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-black text-sm tracking-widest text-black">
                          {cot.order_number as string}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-sm text-black">{v.year} {v.make} {v.model}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{v.vin}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                          {PROCESS_LABELS[cot.selected_process as string] || cot.selected_process as string}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {r ? (
                          <>
                            <p className="font-black text-sm text-black">{fmt(redondear500(r.total))}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmt(r.total)} exacto</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={cot.status as string} />
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Calendar size={11} />
                          {fmtDate(cot.created_at as string)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {photos.length > 0 && <PhotoViewer urls={photos} />}
                          <StatusChanger
                            id={cot.id as string}
                            currentStatus={cot.status as string}
                            estatuses={ESTATUSES}
                          />
                          <a
                            href={`/api/invoice/${cot.id as string}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Invoice interno (desglose completo)"
                            className="flex items-center gap-1.5 px-2 py-1.5 border-2 border-gray-200 text-gray-600 hover:border-black hover:text-black transition-all duration-200 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <FileText size={12} />
                            <span className="hidden lg:inline">PDF</span>
                          </a>
                          <a
                            href={`/api/invoice-cliente/${cot.id as string}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Invoice cliente (solo total)"
                            className="flex items-center gap-1.5 px-2 py-1.5 border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all duration-200 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <User size={12} />
                            <span className="hidden lg:inline">Cliente</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
