import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, budgetId } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  // Genera OTP
  const otp = Math.random().toString(36).slice(-6).toUpperCase()
  const expires_at = new Date(Date.now() + 120 * 60 * 1000) 

  // Verifica email in link_budget_users
  const { data: userAccess } = await supabase
    .from('link_budget_users')
    .select()
    .match({ 
      budget_id: budgetId,
      external_email: email 
    })
    .single()

  if (!userAccess) {
    return NextResponse.json({ error: 'Email non autorizzata' }, { status: 403 })
  }

  // Salva OTP
  await supabase
    .from('temporary_access')
    .insert({
      email,
      otp,
      budget_id: budgetId,
      expires_at
    })

  // Invia email (usa il tuo provider email preferito)
  // Per ora simulo l'invio
  console.log(`OTP per ${email}: ${otp}`)

  return NextResponse.json({ success: true })
}