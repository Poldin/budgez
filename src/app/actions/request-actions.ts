'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client'
import { TablesInsert } from '@/lib/database/supabase'

// Crea una nuova richiesta
export async function createRequest(requestData: {
  title: string
  description: string
  budget?: number
  deadline: string
  verificationId: string
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verifica che l'OTP sia stato verificato
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('verified_at')
      .eq('id', requestData.verificationId)
      .single()

    if (otpError || !otpData || !otpData.verified_at) {
      return { 
        success: false, 
        error: 'Email non verificata. Completa prima la verifica.' 
      }
    }

    // Crea la richiesta
    const insertData: TablesInsert<'requests'> = {
      title: requestData.title,
      description: requestData.description,
      budget: requestData.budget || null,
      deadline: requestData.deadline,
      verification_id: requestData.verificationId,
      is_verified: true,
    }

    const { data, error } = await supabase
      .from('requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating request:', error)
      return { 
        success: false, 
        error: 'Errore nella creazione della richiesta' 
      }
    }

    // Log email sent
    await supabase
      .from('log_email_sent')
      .insert({
        metadata: {
          type: 'request_created',
          request_id: data.id,
          verification_id: requestData.verificationId,
        }
      })

    return { 
      success: true, 
      data,
      message: 'Richiesta pubblicata con successo' 
    }
  } catch (error) {
    console.error('Error in createRequest:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Recupera le richieste attive (deadline >= oggi)
export async function getActiveRequests() {
  try {
    const supabase = createServerSupabaseClient()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        otp_verification:verification_id (
          email
        )
      `)
      .eq('is_verified', true)
      .gte('deadline', today.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching requests:', error)
      return { 
        success: false, 
        error: 'Errore nel recupero delle richieste' 
      }
    }

    return { 
      success: true, 
      data: data || [] 
    }
  } catch (error) {
    console.error('Error in getActiveRequests:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Cerca richieste per titolo o descrizione
export async function searchRequests(query: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        otp_verification:verification_id (
          email
        )
      `)
      .eq('is_verified', true)
      .gte('deadline', today.toISOString())
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching requests:', error)
      return { 
        success: false, 
        error: 'Errore nella ricerca' 
      }
    }

    return { 
      success: true, 
      data: data || [] 
    }
  } catch (error) {
    console.error('Error in searchRequests:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

