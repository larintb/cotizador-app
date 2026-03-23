'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '@/app/actions/auth'
import { Loader2, LogIn } from 'lucide-react'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await login(formData)
      return result ?? initialState
    },
    initialState
  )

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4">
        <Link href="/" className="w-fit block">
          <Image
            src="/images/logo_arancela.png"
            alt="Arancela"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </Link>
      </header>

      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border-2 border-gray-200 shadow-xl">
            {/* Card header */}
            <div className="bg-black text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center">
                  <LogIn size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-black text-lg uppercase tracking-widest">Ingresar</h1>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Sistema de Cotización</p>
                </div>
              </div>
            </div>

            <form action={formAction} className="p-6 space-y-5">
              {state?.error && (
                <div className="p-4 border-l-4 border-[#10B981] bg-emerald-50">
                  <p className="text-sm font-bold text-[#10B981]">{state.error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm font-medium bg-white transition-all duration-200"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm font-medium bg-white transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-[#10B981]"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Ingresar
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/register"
                  className="font-bold text-black hover:text-[#059669] transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
