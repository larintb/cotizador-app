import { obtenerTodosUsuarios } from '@/app/actions/cotizaciones'
import { Users } from 'lucide-react'
import RoleChanger from './_components/RoleChanger'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ROLE_BADGES: Record<string, string> = {
  superadmin: 'bg-[#10B981] text-white',
  admin: 'bg-black text-white',
  cliente: 'bg-gray-100 text-gray-700 border border-gray-200',
}

export default async function UsuariosPage() {
  const { profiles, error } = await obtenerTodosUsuarios()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#10B981] flex items-center justify-center">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profiles?.length ?? 0} usuario{(profiles?.length ?? 0) !== 1 ? 's' : ''} registrado
            {(profiles?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 border-l-4 border-[#10B981] bg-emerald-50 mb-6">
          <p className="text-sm font-bold text-[#10B981]">{error}</p>
        </div>
      )}

      {profiles && profiles.length > 0 && (
        <div className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">
                    Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden md:table-cell">
                    Username
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">
                    Rol Actual
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hidden sm:table-cell">
                    Registro
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest">
                    Cambiar Rol
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(profiles as Record<string, unknown>[]).map((p) => (
                  <tr key={p.id as string} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-sm text-black">
                        {p.nombre as string} {p.apellido as string}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500 font-mono">@{p.username as string}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${
                          ROLE_BADGES[p.role as string] || ROLE_BADGES.cliente
                        }`}
                      >
                        {p.role as string}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">
                        {fmtDate(p.created_at as string)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {(p.role as string) !== 'superadmin' ? (
                        <RoleChanger userId={p.id as string} currentRole={p.role as string} />
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!profiles || profiles.length === 0) && !error && (
        <div className="bg-white border-2 border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-sm">
            Sin usuarios registrados
          </p>
        </div>
      )}
    </div>
  )
}
