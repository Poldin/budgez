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
  
        return NextResponse.json(
          { message: 'Errore durante la registrazione' }, 
          { status: 400 }
        )
      }

      // Se la registrazione è avvenuta con successo e abbiamo un ID utente
      if (signUpData.user?.id) {
        // Cerchiamo tutti i record dove external_email corrisponde alla mail dell'utente registrato
        const { data: linkBudgetUsers, error: queryError } = await supabase
          .from('link_budget_users')
          .select('*')
          .eq('external_email', email)
          //.is('user_id', null) // Prendiamo solo i record dove user_id è null

        if (queryError) {
          console.error('Errore nella query link_budget_users:', queryError)
          // Continuiamo comunque con la registrazione anche se questa parte fallisce
        } else if (linkBudgetUsers && linkBudgetUsers.length > 0) {
          // Per ogni record trovato, aggiorniamo user_id
          const updatePromises = linkBudgetUsers.map(record => {
            return supabase
              .from('link_budget_users')
              .update({ user_id: signUpData.user?.id })
              .eq('id', record.id)
          })

          // Eseguiamo tutti gli aggiornamenti in parallelo
          await Promise.all(updatePromises).catch(error => {
            console.error('Errore nell\'aggiornamento dei link_budget_users:', error)
          })
        }
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