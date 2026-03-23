'use client'

import { Car, Gauge, ArrowRight, ChevronLeft, AlertCircle } from 'lucide-react'

const VIN_USA_CANADA = ['1', '2', '4', '5']

const PROCESSES = [
  {
    id: 'importacion',
    label: 'Importación Definitiva A1',
    description: 'Proceso estándar de importación con documentación completa.',
    igiLabel: '50% V. Aduana',
    yearCheck: () => true,
    vinCheck: () => true,
    note: null,
  },
  {
    id: 'amparo',
    label: 'Proceso de Amparo Legal',
    description: 'Requiere evidencia fotográfica del vehículo (7 fotos obligatorias).',
    igiLabel: '50% V. Aduana',
    yearCheck: () => true,
    vinCheck: (vin: string) => VIN_USA_CANADA.includes(vin?.[0]),
    note: 'Solo aplica para VINs de EE.UU. y Canadá (inicia con 1, 2, 4 o 5).',
  },
  {
    id: 'vu',
    label: 'Procedimiento VU',
    description: 'Aplica para vehículos modelo 2017–2018. IGI: 10%.',
    igiLabel: '10% V. Aduana',
    yearCheck: (year: number) => year >= 2017 && year <= 2018,
    vinCheck: () => true,
    note: 'Solo aplica para vehículos modelo 2017 y 2018.',
  },
  {
    id: 'vf',
    label: 'Procedimiento VF',
    description: 'Aplica para vehículos 2016–2021. IGI: 10% (2016) o 1% (2017–2021).',
    igiLabel: '10% (2016) / 1% (2017–2021)',
    yearCheck: (year: number) => year >= 2016 && year <= 2021,
    vinCheck: () => true,
    note: 'Solo aplica para vehículos modelo 2016 a 2021.',
  },
]

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
  onSelectProcess: (id: string) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2Confirm({
  vehicleData,
  selectedProcess,
  onSelectProcess,
  onNext,
  onBack,
}: Props) {
  const { make, model, year, displacement, cylinders, vin } = vehicleData
  const vehicleYear = parseInt(year, 10)

  const displacementFormatted = displacement ? parseFloat(displacement).toFixed(1) : 'N/D'
  const cylindersFormatted = cylinders || 'N/D'

  return (
    <div className="animate-slide-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Car size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Confirmación de Unidad</h2>
          <p className="text-sm text-gray-500 mt-0.5">Verifique los datos detectados del vehículo</p>
        </div>
      </div>

      {/* Ficha del vehículo */}
      <div className="border-2 border-black p-6 mb-6 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#10B981]" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
            Datos del Vehículo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DataField label="Marca" value={make} />
          <DataField label="Modelo" value={model} />
          <DataField label="Año Modelo" value={year} highlight />
          <DataField
            label="Motorización"
            value={`${displacementFormatted}L — ${cylindersFormatted} cil.`}
            icon={<Gauge size={14} className="text-gray-400" />}
          />
        </div>
      </div>

      {/* Selección de proceso */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#10B981]" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
            Tipo de Proceso
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {PROCESSES.map((proc) => {
            const isSelected = selectedProcess === proc.id
            const isAvailable = proc.yearCheck(vehicleYear) && proc.vinCheck(vin)
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => isAvailable && onSelectProcess(proc.id)}
                disabled={!isAvailable}
                className={`w-full text-left p-4 border-2 transition-all duration-200 flex items-start gap-4 ${
                  !isAvailable
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-[#10B981] bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <div
                  className={`w-5 h-5 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#10B981] bg-[#10B981]' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`font-bold text-sm ${
                        isSelected ? 'text-[#10B981]' : 'text-black'
                      }`}
                    >
                      {proc.label}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 flex-shrink-0 ${
                        isSelected ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      IGI {proc.igiLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{proc.description}</p>
                  {!isAvailable && proc.note && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle size={11} className="text-amber-500 flex-shrink-0" />
                      <p className="text-[11px] text-amber-600 font-bold">{proc.note}</p>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
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
          onClick={onNext}
          disabled={!selectedProcess}
          className={`flex-1 flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
            !selectedProcess
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-[#10B981]'
          }`}
        >
          Continuar
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

function DataField({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: string
  highlight?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 p-3 border border-gray-200">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className={`font-bold text-base ${highlight ? 'text-[#10B981]' : 'text-black'}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}
