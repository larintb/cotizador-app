'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { register } from '@/app/actions/auth'
import { Loader2, UserPlus } from 'lucide-react'

const initialState = { error: '' }

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await register(formData)
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
            src="https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/logo2_white-removebg-preview.png"
            alt="Arancela"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
          />
        </Link>
      </header>

      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ backgroundImage: 'url(https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="w-full max-w-lg">
          <div className="bg-white border-2 border-gray-200 shadow-xl">
            {/* Card header */}
            <div className="bg-black text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-black text-lg uppercase tracking-widest">Crear Cuenta</h1>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    Arancela — Sistema de Cotización
                  </p>
                </div>
              </div>
            </div>

            <form action={formAction} className="p-6 space-y-5">
              {state?.error && (
                <div className="p-4 border-l-4 border-[#10B981] bg-emerald-50">
                  <p className="text-sm font-bold text-[#10B981]">{state.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre" name="nombre" type="text" placeholder="Juan" required />
                <FormField label="Apellido" name="apellido" type="text" placeholder="García" required />
              </div>

              <FormField
                label="Nombre de usuario"
                name="username"
                type="text"
                placeholder="juangarcia"
                required
              />

              <FormField
                label="Correo Electrónico"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Contraseña"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <FormField
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  placeholder="+52 33 1234 5678"
                />
                <FormField
                  label="Código Postal"
                  name="codigo_postal"
                  type="text"
                  placeholder="44100"
                />
              </div>

              <div className="p-3 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tu cuenta se creará con rol de{' '}
                  <span className="font-bold text-black">cliente</span>. Un administrador puede
                  cambiar tu rol posteriormente.
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-[#10B981]"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear Cuenta
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-bold text-black hover:text-[#059669] transition-colors"
                >
                  Ingresa aquí
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  name,
  type,
  placeholder,
  required,
  autoComplete,
}: {
  label: string
  name: string
  type: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
        {label}
        {required && <span className="text-[#10B981] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black outline-none text-sm font-medium bg-white transition-all duration-200"
      />
    </div>
  )
}
