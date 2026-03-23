import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== 'cliente') {
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      redirect('/admin/dashboard')
    }
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/images/logo_arancela.png"
              alt="Arancela"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-widest text-white leading-none">
                {profile.nombre} {profile.apellido}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Cliente</p>
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
