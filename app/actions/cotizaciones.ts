'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateOrderNumber, PROCESS_LABELS, STATUS_LABELS } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { sendOrderCreatedEmail, sendStatusUpdateEmail } from '@/lib/email'

export async function crearCotizacion(data: {
  vehicleData: Record<string, string>
  selectedProcess: string
  customsValueUSD: number
  exchangeRate: number
  agencyFees: number
  result: Record<string, number>
  clientEmail?: string   // opcional: envía el # orden al cliente por email
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  // Generate a unique order number (retry on collision)
  let order_number = generateOrderNumber()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('cotizaciones')
      .select('id')
      .eq('order_number', order_number)
      .maybeSingle()

    if (!existing) break
    order_number = generateOrderNumber()
    attempts++
  }

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .insert({
      order_number,
      admin_id: user.id,
      status: 'validacion',
      vehicle_data: data.vehicleData,
      selected_process: data.selectedProcess,
      customs_value_usd: data.customsValueUSD,
      exchange_rate: data.exchangeRate,
      agency_fees: data.agencyFees,
      result: data.result,
      client_email: data.clientEmail ?? null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Send order number to client if email provided
  if (data.clientEmail && cotizacion) {
    const vd = data.vehicleData
    const totalFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.result.total ?? 0)
    sendOrderCreatedEmail({
      to: data.clientEmail,
      orderNumber: cotizacion.order_number,
      vehiculo: `${vd.year} ${vd.make} ${vd.model}`,
      proceso: PROCESS_LABELS[data.selectedProcess] ?? data.selectedProcess,
      total: totalFmt,
    })
  }

  revalidatePath('/admin/cotizaciones')
  return { cotizacion }
}

export async function obtenerCotizacionesPropias() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.', cotizaciones: [] }

  const { data: cotizaciones, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, cotizaciones: [] }

  return { cotizaciones: cotizaciones ?? [] }
}

export async function actualizarEstatus(id: string, newStatus: string, prevStatus: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  // Fetch cotización to get client_email and vehicle data for notification
  const { data: cot } = await supabase
    .from('cotizaciones')
    .select('client_email, vehicle_data, order_number')
    .eq('id', id)
    .eq('admin_id', user.id)
    .single()

  const { error } = await supabase
    .from('cotizaciones')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('admin_id', user.id)

  if (error) return { error: error.message }

  // Send notification email to client if email is stored
  const clientEmail = (cot as unknown as { client_email?: string } | null)?.client_email
  if (clientEmail && cot) {
    const vd = (cot as unknown as { vehicle_data: Record<string, string> }).vehicle_data
    const vehiculo = vd ? `${vd.year ?? ''} ${vd.make ?? ''} ${vd.model ?? ''}`.trim() : ''
    const fromLabel = STATUS_LABELS[prevStatus]?.label ?? prevStatus
    const toLabel   = STATUS_LABELS[newStatus]?.label  ?? newStatus
    sendStatusUpdateEmail({
      to: clientEmail,
      orderNumber: (cot as unknown as { order_number: string }).order_number,
      vehiculo,
      fromLabel,
      toLabel,
    })
  }

  revalidatePath('/admin/cotizaciones')
  return { success: true }
}

export async function buscarPorOrden(orderNumber: string) {
  // Use service client to bypass RLS for public search
  const supabase = await createServiceClient()

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('order_number', orderNumber.toUpperCase().trim())
    .single()

  if (error || !cotizacion) {
    return { error: 'Cotización no encontrada.' }
  }

  return { cotizacion }
}

export async function obtenerTodosUsuarios() {
  const supabase = await createServiceClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, username, role, created_at')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, profiles: [] }
  return { profiles: profiles ?? [] }
}

export async function actualizarRolUsuario(userId: string, role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  // Verify requester is superadmin
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (requesterProfile?.role !== 'superadmin') {
    return { error: 'Sin permisos.' }
  }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/usuarios')
  return { success: true }
}

export async function obtenerCotizacionPorId(id: string) {
  const supabase = await createServiceClient()

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !cotizacion) return { error: 'No encontrada.' }
  return { cotizacion }
}
