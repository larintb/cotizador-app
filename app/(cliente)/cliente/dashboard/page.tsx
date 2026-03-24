'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, Banknote, Car, Calendar, Calculator, CheckCircle } from 'lucide-react'
import { buscarCotizacion } from '@/app/actions/cotizaciones'
import { fmt, redondear500, STATUS_LABELS, PROCESS_LABELS } from '@/lib/utils'
import { lookupCustomsValue } from '@/lib/catalogoLookup'

import Step1VIN from '@/app/(admin)/admin/dashboard/_components/Step1VIN'
import Step2Confirm from '@/app/(admin)/admin/dashboard/_components/Step2Confirm'
import StepAmparoPhotos from '@/app/(admin)/admin/dashboard/_components/StepAmparoPhotos'
import Step3Adjustments from '@/app/(admin)/admin/dashboard/_components/Step3Adjustments'
import Step4ClientResult from './_components/Step4ClientResult'
import StepSelectAgent from './_components/StepSelectAgent'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VehicleData {
  vin: string
  make: string
  model: string
  year: string
  displacement: string
  cylinders: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.validacion
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold ${s.badge}`}>
      <span className={`w-2 h-2 flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

const STEPS_BASE = [
  { number: 1, label: 'VIN' },
  { number: 2, label: 'Vehículo' },
  { number: 3, label: 'Ajustes' },
  { number: 4, label: 'Resultado' },
]
const STEPS_AMPARO = [
  { number: 1, label: 'VIN' },
  { number: 2, label: 'Vehículo' },
  { number: 3, label: 'Fotos' },
  { number: 4, label: 'Agente' },
]

// ─── Amparo success screen ────────────────────────────────────────────────────

function AmparoSuccess({ orderNumber, onReset }: { orderNumber: string; onReset: () => void }) {
  return (
    <div className="animate-slide-left text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-[#10B981] flex items-center justify-center">
          <CheckCircle size={32} className="text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-2">¡Solicitud Enviada!</h2>
      <p className="text-sm text-gray-500 mb-8">
        Tu solicitud de Amparo Legal fue enviada al agente. Te notificaremos por correo cuando sea aceptada.
      </p>

      <div className="bg-black text-white p-6 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
          Número de Orden
        </p>
        <p className="text-3xl font-black tracking-widest">{orderNumber}</p>
        <p className="text-xs text-gray-400 mt-2">Guarda este número para dar seguimiento a tu trámite</p>
      </div>

      <div className="p-4 border border-gray-200 bg-gray-50 mb-8 text-left">
        <p className="text-xs text-gray-500 leading-relaxed">
          Tu agente revisará la solicitud y recibirás un correo de confirmación.
          Puedes consultar el estado de tu orden en la pestaña <strong className="text-gray-700">Buscar Orden</strong>.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-3 py-4 border-2 border-black font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-200 text-black"
      >
        Nueva Cotización
      </button>
    </div>
  )
}

// ─── Cotizador tab ────────────────────────────────────────────────────────────

function CotizadorTab() {
  const [step, setStep] = useState(1)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [selectedProcess, setSelectedProcess] = useState('')
  const [exchangeRate, setExchangeRate] = useState('20.00')
  const [agencyFees, setAgencyFees] = useState('5500')
  const [customsValueUSD, setCustomsValueUSD] = useState('')
  const [customsValueSource, setCustomsValueSource] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [amparoOrderNumber, setAmparoOrderNumber] = useState<string | null>(null)

  const isAmparo = selectedProcess === 'amparo'

  // Amparo: VIN(1) → Confirm(2) → Fotos(3) → Agente(4)
  // Otros:  VIN(1) → Confirm(2) → Ajustes(3) → Resultado(4)
  const STEPS = isAmparo ? STEPS_AMPARO : STEPS_BASE
  const stepFotos   = isAmparo ? 3 : -1
  const stepAgente  = isAmparo ? 4 : -1
  const stepAjustes = isAmparo ? -1 : 3
  const stepResult  = isAmparo ? -1 : 4

  const handleStep1Next = (data: VehicleData) => {
    setVehicleData(data)
    setSelectedProcess('')
    const lookup = lookupCustomsValue(data.make, data.model, data.year, data.cylinders)
    if (lookup?.value) {
      setCustomsValueUSD(String(lookup.value))
      setCustomsValueSource(lookup.source)
    } else {
      setCustomsValueUSD('')
      setCustomsValueSource('not_found')
    }
    setStep(2)
  }

  const handleReset = () => {
    setStep(1)
    setVehicleData(null)
    setSelectedProcess('')
    setExchangeRate('20.00')
    setAgencyFees('5500')
    setCustomsValueUSD('')
    setCustomsValueSource('')
    setPhotoUrls([])
    setAmparoOrderNumber(null)
  }

  // Amparo success screen
  if (isAmparo && amparoOrderNumber) {
    return <AmparoSuccess orderNumber={amparoOrderNumber} onReset={handleReset} />
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 flex items-center justify-center font-black text-sm transition-all duration-300 ${
                  step === s.number
                    ? 'bg-[#10B981] text-white'
                    : step > s.number
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest hidden sm:inline ${
                  step === s.number ? 'text-black' : step > s.number ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-3 h-0.5 bg-gray-200">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: step > s.number ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white border-2 border-gray-200 shadow-xl p-6 md:p-8">
        {step === 1 && <Step1VIN onNext={handleStep1Next} />}

        {step === 2 && vehicleData && (
          <Step2Confirm
            vehicleData={vehicleData}
            selectedProcess={selectedProcess}
            onSelectProcess={setSelectedProcess}
            onNext={() => setStep(isAmparo ? stepFotos : stepAjustes)}
            onBack={() => setStep(1)}
          />
        )}

        {step === stepFotos && vehicleData && (
          <StepAmparoPhotos
            vin={vehicleData.vin}
            onNext={(urls) => { setPhotoUrls(urls); setStep(stepAgente) }}
            onBack={() => setStep(2)}
          />
        )}

        {step === stepAgente && vehicleData && (
          <StepSelectAgent
            vehicleData={vehicleData as unknown as Record<string, string>}
            photoUrls={photoUrls}
            onBack={() => setStep(stepFotos)}
            onSuccess={(orderNumber) => setAmparoOrderNumber(orderNumber)}
          />
        )}

        {step === stepAjustes && vehicleData && (
          <Step3Adjustments
            selectedProcess={selectedProcess}
            exchangeRate={exchangeRate}
            agencyFees={agencyFees}
            customsValueUSD={customsValueUSD}
            customsValueSource={customsValueSource}
            onExchangeRateChange={setExchangeRate}
            onAgencyFeesChange={setAgencyFees}
            onCustomsValueChange={setCustomsValueUSD}
            onNext={() => setStep(stepResult)}
            onBack={() => setStep(2)}
          />
        )}

        {step === stepResult && vehicleData && (
          <Step4ClientResult
            vehicleData={vehicleData}
            selectedProcess={selectedProcess}
            customsValueUSD={customsValueUSD}
            exchangeRate={exchangeRate}
            agencyFees={agencyFees}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

// ─── Buscar Orden tab ─────────────────────────────────────────────────────────

function BuscarOrdenTab() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cotizacion, setCotizacion] = useState<any>(null)

  const isVin = query.trim().length === 17
  const isOrder = query.trim().length === 7
  const canSearch = isVin || isOrder

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSearch) return
    setLoading(true)
    setError('')
    setCotizacion(null)
    const result = await buscarCotizacion(query)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setCotizacion(result.cotizacion)
    }
  }

  return (
    <div>
      <div className="bg-white border-2 border-gray-200 shadow-xl p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
              Número de Orden o VIN
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
                  setError('')
                  setCotizacion(null)
                }}
                placeholder="ABC-XYZ  ó  1HGBH41JXMN109186"
                maxLength={17}
                className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm font-bold uppercase tracking-widest bg-white transition-all duration-200"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading || !canSearch}
                className="flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-[#10B981]"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Número de orden: 3 letras, guión, 3 letras (ABC-XYZ) · VIN: 17 caracteres
            </p>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-red-400 bg-red-50 mb-6">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-600">{error}</p>
            <p className="text-xs text-red-400 mt-1">
              Verifica el número de orden o VIN e intenta nuevamente.
            </p>
          </div>
        </div>
      )}

      {cotizacion && (
        <div className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden">
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
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-[#10B981]" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Vehículo</span>
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

            <div className="flex items-center justify-between p-4 border border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tipo de Proceso</span>
              <span className="text-sm font-bold text-black">
                {PROCESS_LABELS[cotizacion.selected_process as string] || cotizacion.selected_process}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <Calendar size={12} />
                Fecha de cotización
              </span>
              <span className="text-sm font-bold text-black">
                {new Date(cotizacion.created_at).toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </span>
            </div>

            {cotizacion.result && (
              <div className="bg-[#10B981] p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 text-white">Total</p>
                  <p className="text-3xl font-black text-white">
                    {fmt(redondear500((cotizacion.result as Record<string, number>).total))}
                  </p>
                </div>
                <Banknote size={32} className="text-white opacity-40" />
              </div>
            )}

            {!cotizacion.result && (
              <div className="bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest">
                  Pendiente de aprobación por tu agente
                </p>
              </div>
            )}

            <div className="p-4 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 leading-relaxed">
                Esta cotización es de carácter{' '}
                <span className="font-bold text-gray-700">informativo y referencial</span>. Los
                montos finales pueden variar según el tipo de cambio vigente. Contacta a tu agente Arancela para más información.
              </p>
            </div>
          </div>
        </div>
      )}

      {!cotizacion && !error && (
        <div className="p-5 border border-gray-200 bg-white">
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-bold text-black">¿No tienes tu número de orden o VIN?</span>{' '}
            Contacta directamente a tu agente de Arancela para obtener tu información de seguimiento.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClienteDashboard() {
  const [tab, setTab] = useState<'cotizar' | 'buscar'>('cotizar')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Mi Panel</h1>
        <p className="text-gray-500">Cotiza tu vehículo o consulta el estado de tu orden.</p>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-8">
        <button
          onClick={() => setTab('cotizar')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-0.5 ${
            tab === 'cotizar' ? 'border-[#10B981] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Calculator size={16} />
          Cotizar
        </button>
        <button
          onClick={() => setTab('buscar')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-0.5 ${
            tab === 'buscar' ? 'border-[#10B981] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Search size={16} />
          Buscar Orden
        </button>
      </div>

      {tab === 'cotizar' && <CotizadorTab />}
      {tab === 'buscar' && <BuscarOrdenTab />}
    </div>
  )
}
