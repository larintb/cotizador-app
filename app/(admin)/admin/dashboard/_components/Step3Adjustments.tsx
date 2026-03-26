'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, ChevronLeft, ArrowRight, BookOpen, X, Info } from 'lucide-react'
import type { CatalogDetails } from '@/lib/catalogoLookup'
import { fmt } from '@/lib/utils'

interface Props {
  selectedProcess: string
  exchangeRate: string
  agencyFees: string
  customsValueUSD: string
  customsValueSource: string
  catalogDetails?: CatalogDetails | null
  onExchangeRateChange: (v: string) => void
  onAgencyFeesChange: (v: string) => void
  onCustomsValueChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}

export default function Step3Adjustments({
  selectedProcess,
  exchangeRate,
  agencyFees,
  customsValueUSD,
  customsValueSource,
  catalogDetails,
  onExchangeRateChange,
  onAgencyFeesChange,
  onCustomsValueChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCatalog, setShowCatalog] = useState(false)

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {}
    if (!exchangeRate || isNaN(parseFloat(exchangeRate)) || parseFloat(exchangeRate) <= 0) {
      newErrors.exchangeRate = 'Ingrese un tipo de cambio válido.'
    }
    if (!agencyFees || isNaN(parseFloat(agencyFees)) || parseFloat(agencyFees) < 0) {
      newErrors.agencyFees = 'Ingrese los honorarios de agencia.'
    }
    if (!customsValueUSD || isNaN(parseFloat(customsValueUSD)) || parseFloat(customsValueUSD) <= 0) {
      newErrors.customsValueUSD = 'Ingrese el valor de aduana en USD.'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) onNext()
  }

  return (
    <div className="animate-slide-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <SlidersHorizontal size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Ajustes y Variables</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure los parámetros para el cálculo</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Valor Aduana */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel label="Valor Aduana (USD)" />
            {customsValueSource && customsValueSource !== 'not_found' && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black text-white">
                {customsValueSource === 'exact'
                  ? 'Catálogo'
                  : customsValueSource === 'partial'
                  ? 'Aprox.'
                  : 'Similar'}
              </span>
            )}
            {customsValueSource === 'not_found' && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#10B981] text-white">
                Ingreso Manual
              </span>
            )}
          </div>
          <NumberInput
            value={customsValueUSD}
            onChange={onCustomsValueChange}
            prefix="$"
            suffix="USD"
            placeholder="0.00"
            error={errors.customsValueUSD}
          />
          {!errors.customsValueUSD && customsValueSource === 'not_found' && (
            <p className="text-xs text-[#10B981] font-bold mt-1.5">
              Modelo no encontrado en catálogo. Ingrese el valor manualmente.
            </p>
          )}
          {!errors.customsValueUSD && customsValueSource && customsValueSource !== 'not_found' && (
            <p className="text-xs text-gray-500 mt-1.5">
              Valor obtenido del Catálogo Numérico oficial. Puede modificarlo si es necesario.
            </p>
          )}
          {catalogDetails && (
            <button
              type="button"
              onClick={() => setShowCatalog(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#10B981] hover:underline"
            >
              <BookOpen size={12} /> Ver detalles del catálogo
            </button>
          )}
        </div>

        {/* Catalog Details Modal */}
        {showCatalog && catalogDetails && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowCatalog(false)}
          >
            <div
              className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-black">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#10B981]" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">Detalles del Catálogo</span>
                </div>
                <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Match type badge */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                    catalogDetails.matchTipo === 'exacto'
                      ? 'bg-black text-white'
                      : catalogDetails.matchTipo === 'parcial'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {catalogDetails.matchTipo === 'exacto' ? 'Coincidencia Exacta' : catalogDetails.matchTipo === 'parcial' ? 'Coincidencia Parcial' : 'Aproximado'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                    catalogDetails.fuentePrecio === 'directo' ? 'bg-[#10B981] text-white' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {catalogDetails.fuentePrecio === 'directo' ? 'Precio Directo' : 'Estimado por Grupo'}
                  </span>
                </div>

                {/* Modelo info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Modelo en Catálogo</p>
                    <p className="text-sm font-black text-black">{catalogDetails.modeloCatalogo}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Modelo del VIN</p>
                    <p className="text-sm font-black text-black">{catalogDetails.modeloVIN}</p>
                  </div>
                </div>

                {/* Año info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Año del Vehículo</p>
                    <p className="text-sm font-black text-black">{catalogDetails.anioVehiculo}</p>
                  </div>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Año Efectivo Catálogo</p>
                    <p className="text-sm font-black text-black">{catalogDetails.anioEfectivo}</p>
                    {catalogDetails.anioEfectivo !== catalogDetails.anioVehiculo && (
                      <p className="text-[10px] text-yellow-600 font-bold mt-1 flex items-center gap-1">
                        <Info size={10} /> Año ajustado por disponibilidad
                      </p>
                    )}
                  </div>
                </div>

                {/* Fracción y descripción */}
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Fracción Arancelaria</p>
                    <p className="text-sm font-black text-black font-mono">{catalogDetails.fraccion}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Descripción NICO</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{catalogDetails.descripcionNico}</p>
                  </div>
                  {catalogDetails.umt && (
                    <div className="p-3 bg-gray-50 border border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">UMT</p>
                      <p className="text-sm font-bold text-black">{catalogDetails.umt}</p>
                    </div>
                  )}
                </div>

                {/* Todos los precios */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Precios por Año (USD)</p>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Año</th>
                          <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Valor USD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          const sorted = Object.entries(catalogDetails.todosLosPrecios)
                            .sort(([a], [b]) => Number(b) - Number(a))
                          const minYr = sorted[sorted.length - 1]?.[0]
                          return sorted.map(([yr, price]) => (
                            <tr
                              key={yr}
                              className={yr === catalogDetails.anioEfectivo ? 'bg-[#10B981]/10' : 'hover:bg-gray-50'}
                            >
                              <td className="px-3 py-2 font-bold text-black">
                                {yr === minYr ? `${yr} o menor` : yr}
                                {yr === catalogDetails.anioEfectivo && (
                                  <span className="ml-2 text-[9px] font-bold text-[#10B981] uppercase">Seleccionado</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-black">{fmt(price)}</td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Variables financieras */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel label="Tipo de Cambio (USD/MXN)" />
            <NumberInput
              value={exchangeRate}
              onChange={onExchangeRateChange}
              prefix="$"
              suffix="MXN"
              placeholder="20.00"
              error={errors.exchangeRate}
            />
          </div>
          <div>
            <SectionLabel label="Honorarios Agencia" />
            <NumberInput
              value={agencyFees}
              onChange={onAgencyFeesChange}
              prefix="$"
              suffix="MXN"
              placeholder="5,500"
              error={errors.agencyFees}
            />
          </div>
        </div>

        <div className="p-4 border border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-gray-700">Proceso seleccionado:</span>{' '}
            {{ importacion: 'Importación Definitiva A1', amparo: 'Proceso de Amparo Legal', vu: 'Procedimiento VU', vf: 'Procedimiento VF' }[selectedProcess] || selectedProcess}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
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
          onClick={validateAndNext}
          className="flex-1 flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest bg-black text-white hover:bg-[#10B981] transition-all duration-200"
        >
          Calcular Cotización
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-4 bg-[#10B981]" />
      <label className="text-xs font-bold uppercase tracking-widest text-gray-600">{label}</label>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  error,
}: {
  value: string
  onChange: (v: string) => void
  prefix: string
  suffix: string
  placeholder: string
  error?: string
}) {
  return (
    <>
      <div
        className={`flex items-center border-2 transition-all duration-200 ${
          error ? 'border-[#10B981] bg-emerald-50' : 'border-gray-300 focus-within:border-black bg-white'
        }`}
      >
        <span className="px-3 py-3 text-sm font-bold text-gray-500 border-r border-gray-200 bg-gray-50 flex-shrink-0">
          {prefix}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step="0.01"
          className="flex-1 min-w-0 px-3 py-3 text-sm font-bold text-black outline-none bg-transparent"
        />
        <span className="px-2 py-3 text-xs font-bold text-gray-400 flex-shrink-0">{suffix}</span>
      </div>
      {error && <p className="text-xs text-[#10B981] font-bold mt-1">{error}</p>}
    </>
  )
}
