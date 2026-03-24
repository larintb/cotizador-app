'use client'

import { useEffect, useState } from 'react'
import { UserCheck, ChevronLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getAdmins, crearCotizacionPendiente } from '@/app/actions/cotizaciones'
import { uploadAmparoPhoto } from '@/app/actions/storage'

const FOTO_SLOTS = [
  'frente', 'trasera', 'lateral-der', 'lateral-izq', 'interior', 'motor', 'vin-placa',
]

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.onload = () => {
      try {
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
          else                { width = Math.round((width / height) * MAX);  height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          },
          'image/jpeg', 0.82
        )
      } catch { URL.revokeObjectURL(url); resolve(file) }
    }
    img.src = url
  })
}

interface Agent { id: string; nombre: string; apellido: string }

interface Props {
  vin: string
  vehicleData: Record<string, string>
  photoFiles: File[]
  onBack: () => void
  onSuccess: (orderNumber: string) => void
}

export default function StepSelectAgent({ vin, vehicleData, photoFiles, onBack, onSuccess }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAdmins().then(({ admins }) => {
      setAgents(admins as Agent[])
      setLoadingAgents(false)
    })
  }, [])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSubmit = selectedAgent && emailValid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setProgress('Comprimiendo y subiendo fotos…')

    // Upload all photos now
    const uploadResults = await Promise.all(
      photoFiles.map(async (file, i) => {
        const compressed = await compressImage(file)
        const path = `${vin}/${FOTO_SLOTS[i]}-${Date.now()}.jpg`
        const formData = new FormData()
        formData.append('file', compressed)
        formData.append('path', path)
        return uploadAmparoPhoto(formData)
      })
    )

    const failed = uploadResults.find((r) => 'error' in r)
    if (failed && 'error' in failed) {
      setSubmitting(false)
      setProgress('')
      setError(`Error al subir fotos: ${failed.error}`)
      return
    }

    const photoUrls = uploadResults.map((r) => ('url' in r ? r.url : ''))

    setProgress('Creando solicitud…')
    const result = await crearCotizacionPendiente({
      vehicleData,
      photoUrls,
      agentId: selectedAgent,
      clientEmail: email.trim(),
    })

    setSubmitting(false)
    setProgress('')

    if ('error' in result) {
      setError(result.error ?? 'Error desconocido')
    } else {
      onSuccess(result.orderNumber!)
    }
  }

  return (
    <div className="animate-slide-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <UserCheck size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Selecciona tu Agente</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Al confirmar se subirán las fotos y se enviará la solicitud
          </p>
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

      {/* Agentes */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">
          Agente
        </label>
        {loadingAgents ? (
          <div className="flex items-center justify-center py-8 border-2 border-gray-200">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center gap-2 p-4 border-2 border-gray-200 bg-gray-50">
            <AlertCircle size={16} className="text-gray-400" />
            <p className="text-sm text-gray-500">No hay agentes disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {agents.map((agent) => {
              const selected = selectedAgent === agent.id
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent.id)}
                  disabled={submitting}
                  className={`flex items-center gap-3 p-4 border-2 text-left transition-all duration-200 disabled:opacity-50 ${
                    selected
                      ? 'border-[#10B981] bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 font-black text-sm ${
                    selected ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {agent.nombre[0]}{agent.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm ${selected ? 'text-[#10B981]' : 'text-black'}`}>
                      {agent.nombre} {agent.apellido}
                    </p>
                    <p className="text-xs text-gray-400">Agente Arancela</p>
                  </div>
                  {selected && <CheckCircle size={18} className="text-[#10B981] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
          Tu correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          disabled={submitting}
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm bg-white transition-all duration-200 disabled:opacity-50"
          autoComplete="email"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Te notificaremos cuando el agente acepte tu solicitud.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-red-400 bg-red-50 mb-6">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 font-bold">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-4 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-widest hover:border-black hover:text-black transition-all duration-200 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Regresar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-1 flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
            canSubmit
              ? 'bg-black text-white hover:bg-[#10B981]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> {progress || 'Procesando…'}</>
          ) : (
            <>Enviar Solicitud <Send size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
