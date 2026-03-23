'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const username = formData.get('username') as string
  const telefono = formData.get('telefono') as string
  const codigo_postal = formData.get('codigo_postal') as string

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
        username,
        telefono,
        codigo_postal,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, nombre)

  redirect('/login?registered=1')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const identifier = (formData.get('identifier') as string)?.trim()
  const password   = formData.get('password') as string

  // Resolve email: if no @ treat as username and look up in profiles
  let email = identifier
  if (!identifier.includes('@')) {
    const service = await createServiceClient()

    // First get the user's id from profiles by username
    const { data: profile } = await service
      .from('profiles')
      .select('id')
      .eq('username', identifier)
      .single()

    if (!profile?.id) {
      return { error: 'Usuario no encontrado.' }
    }

    // Then get their email from auth.users via admin API
    const { data: { user: authUser } } = await service.auth.admin.getUserById(profile.id)
    if (!authUser?.email) {
      return { error: 'Usuario no encontrado.' }
    }
    email = authUser.email
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Debes confirmar tu correo electrónico antes de ingresar. Revisa tu bandeja de entrada.' }
    }
    return { error: 'Credenciales incorrectas. Intente de nuevo.' }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
