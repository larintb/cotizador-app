'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, Loader2, X, Banknote } from 'lucide-react'
import { aceptarCotizacion } from '@/app/actions/cotizaciones'
import { calcular, redondear500, fmt, getIGILabel } from '@/lib/utils'
import { lookupCustomsValue, lookupCustomsValueDetails, CatalogDetails } from '@/lib/catalogoLookup'
import Step3Adjustments from '@/app/(admin)/admin/dashboard/_components/Step3Adjustments'

interface Props {
  id: string
  vehicleData: Record<string, string>
}

export default function AcceptButton({ id, vehicleData }: Props) {
  const [open, setOpen]         = useState(false)
  const [modalStep, setModalStep] = useState<'adjustments' | 'confirm'>('adjustments')

  const [exchangeRate, setExchangeRate]       = useState('20.00')
  const [agencyFees, setAgencyFees]           = useState('5500')
  const [customsValueUSD, setCustomsValueUSD] = useState('')
  const [customsValueSource, setCustomsValueSource] = useState('')
  const [catalogDetails, setCatalogDetails] = useState<CatalogDetails | null>(null)

  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const handleOpen = () => {
    const lookup = lookupCustomsValue(
      vehicleData.make, vehicleData.model, vehicleData.year, vehicleData.cylinders
    )
    if (lookup?.value) {
      setCustomsValueUSD(String(lookup.value))
      setCustomsValueSource(lookup.source)
      setCatalogDetails(lookupCustomsValueDetails(vehicleData.make, vehicleData.model, vehicleData.year, vehicleData.cylinders))
    } else {
      setCustomsValueUSD('')
      setCustomsValueSource('not_found')
      setCatalogDetails(null)
    }
    setModalStep('adjustments')
    setError('')
    setOpen(true)
  }

  const handleClose = () => { if (!loading) setOpen(false) }

  const handleNext = () => {
    setModalStep('confirm')
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    const result = calcular(
      parseFloat(customsValueUSD),
      parseFloat(exchangeRate),
      parseFloat(agencyFees),
      'amparo',
      vehicleData.year
    )
    const res = await aceptarCotizacion(id, {
      customsValueUSD: parseFloat(customsValueUSD),
      exchangeRate: parseFloat(exchangeRate),
      agencyFees: parseFloat(agencyFees),
      result: result as unknown as Record<string, number>,
    })
    setLoading(false)
    if ('error' in res) {
      setError(res.error ?? 'Error desconocido')
    } else {
      setDone(true)
      setOpen(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10B981] border-2 border-[#10B981]">
        <CheckCircle size={12} /> Aceptada
      </span>
    )
  }

  // Calc preview for confirm step
  const result = modalStep === 'confirm'
    ? calcular(parseFloat(customsValueUSD), parseFloat(exchangeRate), parseFloat(agencyFees), 'amparo', vehicleData.year)
    : null

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
      >
        <CheckCircle size={12} />
        Aceptar
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-white border-2 border-black max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black flex items-center justify-between px-6 py-4 sticky top-0 z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  {modalStep === 'adjustments' ? 'Calcular cotización' : 'Confirmar y aceptar'}
                </p>
                <p className="font-black text-white text-sm mt-0.5">
                  {vehicleData.year} {vehicleData.make} {vehicleData.model}
                </p>
              </div>
              <button onClick={handleClose} disabled={loading} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {modalStep === 'adjustments' && (
                <Step3Adjustments
                  selectedProcess="amparo"
                  exchangeRate={exchangeRate}
                  agencyFees={agencyFees}
                  customsValueUSD={customsValueUSD}
                  customsValueSource={customsValueSource}
                  catalogDetails={catalogDetails}
                  onExchangeRateChange={setExchangeRate}
                  onAgencyFeesChange={setAgencyFees}
                  onCustomsValueChange={setCustomsValueUSD}
                  onNext={handleNext}
                  onBack={handleClose}
                />
              )}

              {modalStep === 'confirm' && result && (
                <div>
                  {/* Desglose */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                      Desglose del cálculo
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'Valor Aduana (MXN)', value: result.aduanaPesos },
                        { label: 'DTA', value: result.dta },
                        { label: getIGILabel('amparo', vehicleData.year), value: result.igi },
                        { label: 'IVA (16%)', value: result.iva },
                        { label: 'Prevalidación', value: result.preval + result.ivaPreval },
                        { label: 'Honorarios Agencia', value: parseFloat(agencyFees) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                          <span className="text-xs text-gray-500">{label}</span>
                          <span className="text-xs font-bold text-black">{fmt(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-[#10B981] p-5 flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Total</p>
                      <p className="text-3xl font-black text-white">{fmt(redondear500(result.total))}</p>
                      <p className="text-xs text-white/60 mt-1">{fmt(result.total)} exacto</p>
                    </div>
                    <Banknote size={32} className="text-white/30" />
                  </div>

                  {error && (
                    <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalStep('adjustments')}
                      disabled={loading}
                      className="flex-1 py-3 font-black text-xs uppercase tracking-widest bg-gray-100 text-black hover:bg-gray-200 transition-colors disabled:opacity-40"
                    >
                      Ajustar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-black hover:bg-[#10B981] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                        : 'Confirmar y Aceptar'
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
