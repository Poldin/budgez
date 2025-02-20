// app/api/auth/signup/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, userName, termsAccepted, redirectUrl } = await request.json()

    // 1. Prima creiamo l'utente
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: userName,
          terms_accepted: termsAccepted,
          terms_accepted_at: new Date().toISOString()
        },
        emailRedirectTo: redirectUrl
      }
    })
    console.log(signUpError)
    if (signUpError) {
      let errorMessage = 'Errore durante la registrazione'
      if (signUpError.message.includes('User already registered')) {
        errorMessage = 'Email già registrata'
      }
      return NextResponse.json({ message: errorMessage }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Registrazione effettuata. Codice OTP inviato.',
      email,
      userId: signUpData.user?.id
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}