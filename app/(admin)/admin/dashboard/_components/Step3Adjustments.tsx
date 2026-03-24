'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronLeft, ArrowRight } from 'lucide-react'

interface Props {
  selectedProcess: string
  exchangeRate: string
  agencyFees: string
  customsValueUSD: string
  customsValueSource: string
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
  onExchangeRateChange,
  onAgencyFeesChange,
  onCustomsValueChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

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
        </div>

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
