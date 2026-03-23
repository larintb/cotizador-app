'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight, X } from 'lucide-react'

export default function SuccessCelebration() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setVisible(true)
      fireConfetti()
    }
  }, [searchParams])

  function fireConfetti() {
    import('canvas-confetti').then(({ default: confetti }) => {
      // First burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#10B981', '#059669', '#34D399', '#ffffff', '#6EE7B7'],
        scalar: 1.1,
      })

      // Side cannons
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#10B981', '#fff'] })
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#10B981', '#fff'] })
      }, 200)

      // Final shower
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { x: 0.5, y: 0.4 }, colors: ['#10B981', '#059669', '#ffffff'] })
      }, 500)
    })
  }

  function dismiss() {
    setVisible(false)
    router.replace('/planes')
  }

  function goToDashboard() {
    router.push('/admin/dashboard')
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md"
        style={{ background: '#0D1117', border: '2px solid #10B981' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Green top bar */}
        <div style={{ background: '#10B981', height: '4px' }} />

        <div className="p-10 flex flex-col items-center text-center">

          {/* Animated check icon */}
          <div
            className="w-20 h-20 flex items-center justify-center mb-6"
            style={{
              background: '#064E3B',
              border: '2px solid #10B981',
              animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both',
            }}
          >
            <CheckCircle2 size={40} style={{ color: '#10B981' }} />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>
            ¡Suscripción activada!
          </p>

          <h2
            className="font-black uppercase tracking-tight leading-none mb-4"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: '#ffffff' }}
          >
            Ya empezamos a<br />
            <span style={{ color: '#10B981' }}>ahorrar tiempo.</span>
          </h2>

          <p className="text-sm mb-8" style={{ color: '#64748B', lineHeight: 1.7 }}>
            Tu plan está activo. Ahora puedes cotizar importaciones en segundos y compartir el resultado con tus clientes al instante.
          </p>

          <button
            onClick={goToDashboard}
            className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            Ir al dashboard <ArrowRight size={16} />
          </button>

        </div>
      </div>

      <style>{`
        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
