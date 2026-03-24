'use server'

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'amparo-fotos'

// Admin client con service role — bypassa RLS completamente
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function uploadAmparoPhoto(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  const path = formData.get('path') as string | null

  if (!file || !path) return { error: 'Datos incompletos.' }

  try {
    const supabase = adminClient()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { upsert: true, contentType: file.type })

    if (error) return { error: error.message }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl }
  } catch (err) {
    return { error: String(err) }
  }
}
