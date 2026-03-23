'use client'

import { useState } from 'react'
import { Search, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

interface VehicleData {
  vin: string
  make: string
  model: string
  year: string
  displacement: string
  cylinders: string
}

interface Props {
  onNext: (data: VehicleData) => void
}

export default function Step1VIN({ onNext }: Props) {
  const [vin, setVin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    setVin(val.slice(0, 17))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (vin.length !== 17) {
      setError('El VIN debe tener exactamente 17 caracteres.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
      )
      if (!res.ok) throw new Error('Error al conectar con el servicio NHTSA.')

      const data = await res.json()
      const result = data.Results?.[0]

      if (!result || result.ErrorCode !== '0') {
        setError('No se pudo decodificar el VIN. Verifique e intente nuevamente.')
        setLoading(false)
        return
      }

      onNext({
        vin,
        make: result.Make,
        model: result.Model,
        year: result.ModelYear,
        displacement: result.DisplacementL,
        cylinders: result.EngineCylinders,
      })
    } catch {
      setError('Error de conexión. Verifique su internet e intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const vinProgress = (vin.length / 17) * 100

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Validación de VIN</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ingrese el número de identificación del vehículo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
            Número VIN
          </label>
          <div className="relative">
            <input
              type="text"
              value={vin}
              onChange={handleVinChange}
              placeholder="Ej. 1HGBH41JXMN109186"
              className={`w-full px-4 py-4 pr-14 text-base font-bold uppercase tracking-widest border-2 outline-none transition-all duration-200 bg-white ${
                error
                  ? 'border-[#10B981] text-[#10B981]'
                  : vin.length === 17
                  ? 'border-black text-black'
                  : 'border-gray-300 text-black focus:border-black'
              }`}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {vin.length}/17
            </span>
          </div>
          <div className="h-1 bg-gray-200 mt-1">
            <div
              className={`h-full transition-all duration-300 ${
                vin.length === 17 ? 'bg-black' : 'bg-[#10B981]'
              }`}
              style={{ width: `${vinProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`flex items-center gap-2 p-3 border ${
              vin.length === 17 ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div
              className={`w-2 h-2 ${vin.length === 17 ? 'bg-black' : 'bg-gray-300'}`}
            />
            <span className="text-xs font-bold text-gray-600">17 caracteres</span>
          </div>
          <div
            className={`flex items-center gap-2 p-3 border ${
              vin.length === 17 ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div
              className={`w-2 h-2 ${vin.length === 17 ? 'bg-black' : 'bg-gray-300'}`}
            />
            <span className="text-xs font-bold text-gray-600">Formato VIN estándar</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 border-l-4 border-[#10B981] bg-emerald-50 animate-fade-in">
            <AlertCircle size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-[#10B981]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || vin.length !== 17}
          className={`w-full flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
            loading || vin.length !== 17
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-[#10B981]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Consultando NHTSA...
            </>
          ) : (
            <>
              <Search size={18} />
              Decodificar VIN
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 border border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-700">Nota:</span> Se aceptan VINs de cualquier
          origen. El Proceso de Amparo Legal solo está disponible para vehículos con VIN de{' '}
          <span className="font-bold text-black">EE.UU. y Canadá</span> (inicia con 1, 2, 4 o 5).
          La consulta se realiza en tiempo real a la base de datos NHTSA.
        </p>
      </div>
    </div>
  )
}
