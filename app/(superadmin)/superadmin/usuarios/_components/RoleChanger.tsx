'use client'

import { useTransition } from 'react'
import { actualizarRolUsuario } from '@/app/actions/cotizaciones'

interface Props {
  userId: string
  currentRole: string
}

export default function RoleChanger({ userId, currentRole }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    startTransition(() => {
      actualizarRolUsuario(userId, newRole)
    })
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs font-bold uppercase tracking-wide border-2 border-gray-200 bg-white px-3 py-1.5 outline-none focus:border-black transition-all duration-200 disabled:opacity-50 cursor-pointer"
    >
      <option value="cliente">Cliente</option>
      <option value="admin">Admin</option>
    </select>
  )
}
