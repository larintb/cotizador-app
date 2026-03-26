'use client'

import { useState } from 'react'
import Step1VIN from './_components/Step1VIN'
import Step2Confirm from './_components/Step2Confirm'
import StepAmparoPhotos from './_components/StepAmparoPhotos'
import Step3Adjustments from './_components/Step3Adjustments'
import Step4Result from './_components/Step4Result'

import { lookupCustomsValue, lookupCustomsValueDetails, CatalogDetails } from '@/lib/catalogoLookup'

interface VehicleData {
  vin: string
  make: string
  model: string
  year: string
  displacement: string
  cylinders: string
}

// Con amparo: VIN → Vehículo → Fotos → Ajustes → Resultado (5 pasos)
// Sin amparo: VIN → Vehículo → Ajustes → Resultado (4 pasos)
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
  { number: 4, label: 'Ajustes' },
  { number: 5, label: 'Resultado' },
]

export default function DashboardPage() {
  const [step, setStep] = useState(1)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [selectedProcess, setSelectedProcess] = useState('')
  const [exchangeRate, setExchangeRate] = useState('20.00')
  const [agencyFees, setAgencyFees] = useState('5500')
  const [customsValueUSD, setCustomsValueUSD] = useState('')
  const [customsValueSource, setCustomsValueSource] = useState('')
  const [catalogDetails, setCatalogDetails] = useState<CatalogDetails | null>(null)

  const isAmparo = selectedProcess === 'amparo'
  const STEPS = isAmparo ? STEPS_AMPARO : STEPS_BASE
  // Mapeo de step lógico a índice de componente
  const stepFotos    = isAmparo ? 3 : -1
  const stepAjustes  = isAmparo ? 4 : 3
  const stepResult   = isAmparo ? 5 : 4

  const handleStep1Next = (data: VehicleData) => {
    setVehicleData(data)
    setSelectedProcess('')
    const lookup = lookupCustomsValue(data.make, data.model, data.year, data.cylinders)
    if (lookup?.value) {
      setCustomsValueUSD(String(lookup.value))
      setCustomsValueSource(lookup.source)
      setCatalogDetails(lookupCustomsValueDetails(data.make, data.model, data.year, data.cylinders))
    } else {
      setCustomsValueUSD('')
      setCustomsValueSource('not_found')
      setCatalogDetails(null)
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
    setCatalogDetails(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-8 h-8 flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    step === s.number
                      ? 'bg-[#10B981] text-white'
                      : step > s.number
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step > s.number ? '✓' : s.number}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-widest hidden sm:inline ${
                    step === s.number ? 'text-black' : step > s.number ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
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
            onNext={(_files) => setStep(stepAjustes)}
            onBack={() => setStep(2)}
          />
        )}

        {step === stepAjustes && vehicleData && (
          <Step3Adjustments
            selectedProcess={selectedProcess}
            exchangeRate={exchangeRate}
            agencyFees={agencyFees}
            customsValueUSD={customsValueUSD}
            customsValueSource={customsValueSource}
            catalogDetails={catalogDetails}
            onExchangeRateChange={setExchangeRate}
            onAgencyFeesChange={setAgencyFees}
            onCustomsValueChange={setCustomsValueUSD}
            onNext={() => setStep(stepResult)}
            onBack={() => setStep(isAmparo ? stepFotos : 2)}
          />
        )}

        {step === stepResult && vehicleData && (
          <Step4Result
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
