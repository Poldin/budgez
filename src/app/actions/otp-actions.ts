'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client'

// Genera un codice OTP a 6 cifre
function generateOTP(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

// Crea un nuovo OTP e lo invia via email
export async function createAndSendOTP(email: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Genera OTP
    const otpCode = generateOTP()
    
    // Crea record in database
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .insert({
        email: email,
        otp: otpCode,
        verified_at: null,
      })
      .select()
      .single()

    if (otpError) {
      console.error('Error creating OTP:', otpError)
      return { 
        success: false, 
        error: 'Errore nella creazione del codice di verifica' 
      }
    }

    // Invia email con OTP
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Codice di verifica Budgez',
        otpCode: otpCode.toString(),
      }),
    })

    if (!emailResponse.ok) {
      console.error('Error sending email:', await emailResponse.text())
      // Elimina il record OTP se l'invio email fallisce
      await supabase
        .from('otp_verification')
        .delete()
        .eq('id', otpData.id)
      
      return { 
        success: false, 
        error: 'Errore nell\'invio dell\'email' 
      }
    }

    return { 
      success: true, 
      verificationId: otpData.id,
      message: 'Codice inviato con successo' 
    }
  } catch (error) {
    console.error('Error in createAndSendOTP:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Verifica il codice OTP inserito dall'utente
export async function verifyOTP(verificationId: string, otpCode: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Recupera il record OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('id', verificationId)
      .single()

    if (otpError || !otpData) {
      return { 
        success: false, 
        error: 'Codice di verifica non trovato' 
      }
    }

    // Verifica se già verificato
    if (otpData.verified_at) {
      return { 
        success: true, 
        message: 'Email già verificata' 
      }
    }

    // Verifica scadenza (10 minuti)
    const createdAt = new Date(otpData.created_at)
    const now = new Date()
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    if (diffMinutes > 10) {
      return { 
        success: false, 
        error: 'Il codice è scaduto. Richiedi un nuovo codice.' 
      }
    }

    // Verifica codice
    if (otpData.otp?.toString() !== otpCode.toString()) {
      return { 
        success: false, 
        error: 'Codice non valido' 
      }
    }

    // Aggiorna verified_at usando la funzione SQL now()
    const { error: updateError } = await supabase
      .from('otp_verification')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationId)

    if (updateError) {
      console.error('Error updating verified_at:', updateError)
      return { 
        success: false, 
        error: 'Errore nella verifica' 
      }
    }

    return { 
      success: true, 
      message: 'Email verificata con successo' 
    }
  } catch (error) {
    console.error('Error in verifyOTP:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Re-invia un nuovo OTP (cambia il codice nel database)
export async function resendOTP(verificationId: string, email: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Genera nuovo OTP
    const newOtpCode = generateOTP()
    
    // Aggiorna il record esistente con nuovo OTP e reset verified_at
    const { error: updateError } = await supabase
      .from('otp_verification')
      .update({ 
        otp: newOtpCode,
        verified_at: null,
        created_at: new Date().toISOString() // Aggiorna anche il timestamp
      })
      .eq('id', verificationId)

    if (updateError) {
      console.error('Error updating OTP:', updateError)
      return { 
        success: false, 
        error: 'Errore nell\'aggiornamento del codice' 
      }
    }

    // Invia email con nuovo OTP
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Nuovo codice di verifica Budgez',
        otpCode: newOtpCode.toString(),
      }),
    })

    if (!emailResponse.ok) {
      console.error('Error sending email:', await emailResponse.text())
      return { 
        success: false, 
        error: 'Errore nell\'invio dell\'email' 
      }
    }

    return { 
      success: true, 
      message: 'Nuovo codice inviato con successo' 
    }
  } catch (error) {
    console.error('Error in resendOTP:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

