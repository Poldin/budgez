import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
      const { email, password, userName, termsAccepted, redirectUrl } = await request.json()
  
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

    //   console.log(signUpData)
    //   console.log(signUpError)
  
      if (signUpError) {
        if (signUpError.message === 'User already registered') {
          return NextResponse.json(
            { 
              message: 'Utente già registrato. Procedi con il login.',
              status: 'ALREADY_REGISTERED'
            }, 
            { status: 400 }
          )
        }
  
        // Altri errori di signup
        return NextResponse.json(
          { message: 'Errore durante la registrazione' }, 
          { status: 400 }
        )
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