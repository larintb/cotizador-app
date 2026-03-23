'use client'

import { useState } from 'react'
import { RotateCcw, Banknote, Receipt, Save, CheckCircle, Loader2 } from 'lucide-react'
import { calcular, redondear500, getIGILabel, fmt } from '@/lib/utils'
import { crearCotizacion } from '@/app/actions/cotizaciones'

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
  onReset: () => void
}

export default function Step4Result({
  vehicleData,
  selectedProcess,
  customsValueUSD,
  exchangeRate,
  agencyFees,
  onReset,
}: Props) {
  const [savedOrderNumber, setSavedOrderNumber] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const result = calcular(
    parseFloat(customsValueUSD),
    parseFloat(exchangeRate),
    parseFloat(agencyFees),
    selectedProcess,
    vehicleData.year
  )

  const igiLabel = getIGILabel(selectedProcess, vehicleData.year)

  const PROCESS_LABELS: Record<string, string> = {
    importacion: 'Importación Definitiva A1',
    amparo: 'Proceso de Amparo Legal',
    vu: 'Procedimiento VU',
    vf: 'Procedimiento VF',
  }
  const processLabel = PROCESS_LABELS[selectedProcess] || selectedProcess

  const handleSave = async () => {
    if (savedOrderNumber || saving) return
    setSaving(true)
    setSaveError('')

    const res = await crearCotizacion({
      vehicleData: vehicleData as unknown as Record<string, string>,
      selectedProcess,
      customsValueUSD: parseFloat(customsValueUSD),
      exchangeRate: parseFloat(exchangeRate),
      agencyFees: parseFloat(agencyFees),
      result: result as unknown as Record<string, number>,
    })

    setSaving(false)

    if (res.error) {
      setSaveError(res.error)
    } else if (res.cotizacion) {
      setSavedOrderNumber(res.cotizacion.order_number)
    }
  }

  return (
    <div className="animate-slide-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Receipt size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Cotización Final</h2>
          <p className="text-sm text-gray-500 mt-0.5">{processLabel}</p>
        </div>
      </div>

      {/* Vehículo */}
      <div className="bg-black text-white p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Unidad</p>
          <p className="font-black text-lg tracking-tight">
            {vehicleData.year} {vehicleData.make} {vehicleData.model}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">VIN</p>
          <p className="font-bold text-sm tracking-widest text-gray-300">{vehicleData.vin}</p>
        </div>
      </div>

      {/* Desglose */}
      <div className="border-2 border-gray-200 mb-4">
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50">
          <div className="w-1 h-4 bg-[#10B981]" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
            Desglose de Impuestos
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          <RowBase
            label="Valor Aduana (USD)"
            value={`$ ${parseFloat(customsValueUSD).toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD`}
          />
          <RowBase
            label="Tipo de Cambio"
            value={`$ ${parseFloat(exchangeRate).toFixed(2)} MXN/USD`}
          />
          <RowHighlight label="V. Aduana en Pesos" value={fmt(result.aduanaPesos)} />
          <div className="h-px bg-gray-200" />
          <Row label="D.T.A." sublabel="(0.8% V. Aduana)" value={fmt(result.dta)} />
          <Row label="I.G.I." sublabel={`(${igiLabel})`} value={fmt(result.igi)} />
          <Row label="I.V.A." sublabel="(16% Base + DTA + IGI)" value={fmt(result.iva)} />
          <Row label="Prevalidación" sublabel="(Fijo)" value={fmt(result.preval)} />
          <Row label="IVA Prevalidación" sublabel="(Fijo)" value={fmt(result.ivaPreval)} />
        </div>
        <div className="p-4 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Subtotal Impuestos
          </span>
          <span className="text-base font-black text-black">{fmt(result.impuestos)}</span>
        </div>
      </div>

      {/* Honorarios */}
      <div className="border-2 border-gray-200 mb-4">
        <div className="divide-y divide-gray-100">
          <Row label="Honorarios Agencia" sublabel="" value={fmt(parseFloat(agencyFees))} />
        </div>
      </div>

      {/* Total */}
      <div className="border-2 border-[#10B981] mb-6">
        <div className="p-5 bg-white border-b-2 border-[#10B981] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
              Total Exacto
            </p>
            <p className="text-2xl font-black tracking-tight text-black">{fmt(result.total)}</p>
          </div>
          <Banknote size={32} className="text-gray-300" />
        </div>
        <div className="p-5 bg-[#10B981] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 text-white">
              Total Redondeado
            </p>
            <p className="text-3xl font-black tracking-tight text-white">
              {fmt(redondear500(result.total))}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white px-2 py-1">
            Al siguiente {result.total % 500 === 0 ? '—' : result.total % 1000 < 500 ? '500' : '1,000'}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 border border-gray-200 bg-gray-50 mb-6">
        <p className="text-xs text-gray-500 leading-relaxed">
          Esta cotización es de carácter{' '}
          <span className="font-bold text-gray-700">informativo y referencial</span>. Los montos
          finales pueden variar según el tipo de cambio vigente al momento del trámite y otros
          factores aduaneros. Arancela no se hace responsable por diferencias al momento del
          proceso.
        </p>
      </div>

      {/* Error */}
      {saveError && (
        <div className="p-4 border-l-4 border-[#10B981] bg-emerald-50 mb-4">
          <p className="text-sm font-bold text-[#10B981]">{saveError}</p>
        </div>
      )}

      {/* Banner de guardado */}
      {savedOrderNumber && (
        <div className="flex items-center gap-3 p-4 border-2 border-green-500 bg-green-50 mb-4 animate-fade-in">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">¡Cotización guardada exitosamente!</p>
            <p className="text-xs text-green-600 font-bold tracking-widest mt-0.5">
              Número de orden: <span className="text-lg">{savedOrderNumber}</span>
            </p>
          </div>
        </div>
      )}

      {/* Botón guardar */}
      {!savedOrderNumber && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition-all duration-200 mb-3 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar Cotización
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-3 py-4 border-2 border-black font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-200 text-black"
      >
        <RotateCcw size={16} />
        Nueva Consulta
      </button>
    </div>
  )
}

function Row({ label, sublabel, value }: { label: string; sublabel: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <span className="text-sm font-bold text-black">{label}</span>
        {sublabel && <span className="text-xs text-gray-400 ml-1.5">{sublabel}</span>}
      </div>
      <span className="text-sm font-bold text-black tabular-nums">{value}</span>
    </div>
  )
}

function RowBase({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className="text-xs font-bold text-gray-600 tabular-nums">{value}</span>
    </div>
  )
}

function RowHighlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-100">
      <span className="text-sm font-bold text-black">{label}</span>
      <span className="text-sm font-black text-black tabular-nums">{value}</span>
    </div>
  )
}
