import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function POST(request: Request) {
    const { email, otp, budgetId } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
  
    // Verifica OTP
    const { data: access, error } = await supabase
      .from('temporary_access')
      .select()
      .match({ 
        email, 
        otp, 
        budget_id: budgetId, 
        used: false 
      })
      .gt('expires_at', new Date().toISOString()) // <-- Modifica qui: convertiamo la data in ISO string
      .single()
  
    console.log('OTP verification with formatted date:', { 
      access, 
      error,
      formattedDate: new Date().toISOString() 
    })
  
    if (!access) {
      return NextResponse.json({ error: 'OTP non valido o scaduto' }, { status: 400 })
    }
  
    // Marca OTP come usato
    await supabase
      .from('temporary_access')
      .update({ used: true })
      .match({ id: access.id })
  
    // Genera JWT
    const token = await new SignJWT({ 
      budgetId,
      email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(secret)
  
    return NextResponse.json({ token })
  }