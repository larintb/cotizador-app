'use client'

import { RotateCcw, Banknote, UserCheck } from 'lucide-react'
import { calcular, redondear500, fmt } from '@/lib/utils'

interface VehicleData {
  vin: string
  make: string
  model: string
  year: string
  displacement: string
  cylinders: string
}

interface Props {
  vehicleData: VehicleData
  selectedProcess: string
  customsValueUSD: string
  exchangeRate: string
  agencyFees: string
  onNext: () => void
  onReset: () => void
}

const PROCESS_LABELS: Record<string, string> = {
  importacion: 'Importación Definitiva A1',
  amparo: 'Proceso de Amparo Legal',
  vu: 'Procedimiento VU',
  vf: 'Procedimiento VF',
}

export default function Step4ClientResult({
  vehicleData,
  selectedProcess,
  customsValueUSD,
  exchangeRate,
  agencyFees,
  onNext,
  onReset,
}: Props) {
  const result = calcular(
    parseFloat(customsValueUSD),
    parseFloat(exchangeRate),
    parseFloat(agencyFees),
    selectedProcess,
    vehicleData.year
  )

  const total = redondear500(result.total)
  const processLabel = PROCESS_LABELS[selectedProcess] || selectedProcess

  return (
    <div className="animate-slide-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Banknote size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Cotización</h2>
          <p className="text-sm text-gray-500 mt-0.5">{processLabel}</p>
        </div>
      </div>

      {/* Vehículo */}
      <div className="bg-black text-white p-4 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Vehículo</p>
        <p className="font-black text-lg tracking-tight">
          {vehicleData.year} {vehicleData.make} {vehicleData.model}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-1">VIN: {vehicleData.vin}</p>
      </div>

      {/* Total */}
      <div className="bg-[#10B981] p-8 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
            Total Estimado
          </p>
          <p className="text-4xl font-black text-white tracking-tight">{fmt(total)}</p>
        </div>
        <Banknote size={40} className="text-white/30" />
      </div>

      {/* Disclaimer */}
      <div className="p-4 border border-gray-200 bg-gray-50 mb-6">
        <p className="text-xs text-gray-500 leading-relaxed">
          Esta cotización es de carácter{' '}
          <span className="font-bold text-gray-700">informativo y referencial</span>. Los montos
          finales pueden variar según el tipo de cambio vigente al momento del trámite y otros
          factores aduaneros. Contacta a tu agente Arancela para más información.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest hover:bg-[#10B981] transition-all duration-200 mb-3"
      >
        <UserCheck size={16} />
        Seleccionar Agente
      </button>

      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-3 py-4 border-2 border-black font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-200 text-black"
      >
        <RotateCcw size={16} />
        Nueva Cotización
      </button>
    </div>
  )
}
