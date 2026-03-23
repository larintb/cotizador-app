import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    redirect('/cliente/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      {/* Header */}
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

            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/admin/dashboard" icon={<LayoutDashboard size={14} />} label="Cotizador" />
              <NavLink href="/admin/cotizaciones" icon={<ClipboardList size={14} />} label="Historial" />

            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-widest text-white leading-none">
                {profile.nombre} {profile.apellido}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                {profile.role}
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

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-gray-800 flex">
          <MobileNavLink href="/admin/dashboard" label="Cotizador" />
          <MobileNavLink href="/admin/cotizaciones" label="Historial" />
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 text-xs font-bold uppercase tracking-widest"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 text-center py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
    >
      {label}
    </Link>
  )
}
