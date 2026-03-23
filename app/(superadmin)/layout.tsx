import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Shield, LogOut, Users } from 'lucide-react'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, apellido, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'superadmin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image
                src="/images/logo2_white-removebg-preview.png"
                alt="Arancela"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/superadmin/usuarios"
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 text-xs font-bold uppercase tracking-widest"
              >
                <Users size={14} />
                Usuarios
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]">
              <Shield size={12} className="text-white" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                Superadmin
              </span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-widest text-white leading-none">
                {profile.nombre} {profile.apellido}
              </p>
            </div>
            <form
              action={async () => {
                'use server'
                await logout()
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 border border-gray-600 text-gray-400 hover:border-white hover:text-white transition-all duration-200 text-xs font-bold uppercase tracking-widest"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
