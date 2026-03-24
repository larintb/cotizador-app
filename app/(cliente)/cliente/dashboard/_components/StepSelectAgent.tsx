'use client'

import { useEffect, useState } from 'react'
import { UserCheck, ChevronLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getAdmins, crearCotizacionPendiente } from '@/app/actions/cotizaciones'

interface Agent {
  id: string
  nombre: string
  apellido: string
}

interface Props {
  vehicleData: Record<string, string>
  photoUrls: string[]
  onBack: () => void
  onSuccess: (orderNumber: string) => void
}

export default function StepSelectAgent({ vehicleData, photoUrls, onBack, onSuccess }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
    const result = await crearCotizacionPendiente({
      vehicleData,
      photoUrls,
      agentId: selectedAgent,
      clientEmail: email.trim(),
    })
    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      onSuccess(result.orderNumber!)
    }
  }

  return (
    <div className="animate-slide-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <UserCheck size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Selecciona tu Agente</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tu solicitud será enviada al agente elegido</p>
        </div>
      </div>

      {/* Vehículo resumen */}
      <div className="bg-black text-white p-4 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Vehículo</p>
        <p className="font-black text-lg tracking-tight">
          {vehicleData.year} {vehicleData.make} {vehicleData.model}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-1">VIN: {vehicleData.vin}</p>
      </div>

      {/* Lista de agentes */}
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
                  className={`flex items-center gap-3 p-4 border-2 text-left transition-all duration-200 ${
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
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm bg-white transition-all duration-200"
          autoComplete="email"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Te enviaremos una confirmación cuando el agente acepte tu solicitud.
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
            <><Loader2 size={16} className="animate-spin" /> Enviando...</>
          ) : (
            <>Enviar Solicitud <Send size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
