'use client'

import { useTransition } from 'react'
import { actualizarEstatus } from '@/app/actions/cotizaciones'

interface Estatus {
  value: string
  label: string
  dot: string
  badge: string
  color: string
}

interface Props {
  id: string
  currentStatus: string
  estatuses: Estatus[]
}

export default function StatusChanger({ id, currentStatus, estatuses }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    startTransition(() => {
      actualizarEstatus(id, newStatus)
    })
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="text-[10px] font-bold uppercase tracking-wide border-2 border-gray-200 bg-white px-2 py-1.5 outline-none focus:border-black transition-all duration-200 disabled:opacity-50 cursor-pointer"
    >
      {estatuses.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </select>
  )
}
