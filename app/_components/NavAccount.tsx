'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutDashboard, CreditCard, LogOut, User, BadgeCheck, Home } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type Props = {
  nombre: string
  role: 'cliente' | 'admin' | 'superadmin'
}

const DASHBOARD_HREF: Record<string, string> = {
  admin: '/admin/dashboard',
  superadmin: '/superadmin/usuarios',
  cliente: '/cliente/dashboard',
}

export default function NavAccount({ nombre, role }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:text-[#10B981]"
        style={{ border: '1px solid #21262D', color: '#94A3B8' }}
      >
        <User size={14} />
        {nombre}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-52 z-50"
          style={{ background: '#161B22', border: '1px solid #21262D', boxShadow: '0 8px 24px #00000066' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #21262D' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>
              {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Agente' : 'Cliente'}
            </p>
          </div>

          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#10B981] hover:bg-[#10B98111]"
            style={{ color: '#94A3B8', borderBottom: '1px solid #21262D' }}
          >
            <Home size={13} />
            Inicio
          </Link>

          <Link
            href={DASHBOARD_HREF[role]}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#10B981] hover:bg-[#10B98111]"
            style={{ color: '#94A3B8', borderBottom: '1px solid #21262D' }}
          >
            <LayoutDashboard size={13} />
            Mi Dashboard
          </Link>

          <Link
            href="/membresia"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#10B981] hover:bg-[#10B98111]"
            style={{ color: '#94A3B8', borderBottom: '1px solid #21262D' }}
          >
            <BadgeCheck size={13} />
            Membresía
          </Link>

          <Link
            href="/planes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#10B981] hover:bg-[#10B98111]"
            style={{ color: '#94A3B8', borderBottom: '1px solid #21262D' }}
          >
            <CreditCard size={13} />
            Planes
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white hover:bg-[#ffffff0a]"
            style={{ color: '#6b7280' }}
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
