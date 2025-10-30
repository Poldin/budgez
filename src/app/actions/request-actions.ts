'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client'
import { TablesInsert } from '@/lib/database/supabase'

// Upload PDF to Supabase Storage
export async function uploadRequestPDF(formData: FormData) {
  try {
    const file = formData.get('file') as File
    
    if (!file) {
      return { success: false, error: 'Nessun file fornito' }
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Il file deve essere massimo 5MB' }
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'Solo file PDF sono accettati' }
    }

    const supabase = createServerSupabaseClient()
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const filename = `${timestamp}-${randomString}.pdf`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('attachements')
      .upload(filename, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: 'Errore nel caricamento del file' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachements')
      .getPublicUrl(filename)

    return { 
      success: true, 
      url: urlData.publicUrl,
      filename: filename 
    }
  } catch (error) {
    console.error('Error in uploadRequestPDF:', error)
    return { success: false, error: 'Errore imprevisto' }
  }
}

// Crea una nuova richiesta
export async function createRequest(requestData: {
  title: string
  description: string
  budget?: number
  deadline: string
  verificationId: string
  attachmentUrl?: string
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
      attachment_url: requestData.attachmentUrl || null,
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

// Ottieni il numero di proposte per una richiesta
export async function getProposalsCountForRequest(requestId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { count, error } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', requestId)

    if (error) {
      console.error('Error counting proposals:', error)
      return { 
        success: false, 
        error: 'Errore nel conteggio delle proposte',
        count: 0
      }
    }

    return { 
      success: true, 
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getProposalsCountForRequest:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto',
      count: 0
    }
  }
}

// Ottieni il numero di proposte per multiple richieste
export async function getProposalsCountsForRequests(requestIds: string[]) {
  try {
    const supabase = createServerSupabaseClient()
    
    if (requestIds.length === 0) {
      return { 
        success: true, 
        data: {}
      }
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .select('request_id')
      .in('request_id', requestIds)

    if (error) {
      console.error('Error counting proposals:', error)
      return { 
        success: false, 
        error: 'Errore nel conteggio delle proposte',
        data: {}
      }
    }

    // Count proposals per request
    const counts: Record<string, number> = {}
    requestIds.forEach(id => {
      counts[id] = 0
    })
    
    data?.forEach((proposal) => {
      if (proposal.request_id) {
        counts[proposal.request_id] = (counts[proposal.request_id] || 0) + 1
      }
    })

    return { 
      success: true, 
      data: counts
    }
  } catch (error) {
    console.error('Error in getProposalsCountsForRequests:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto',
      data: {}
    }
  }
}

