'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client'
import { TablesInsert } from '@/lib/database/supabase'

// Upload PDF to Supabase Storage
export async function uploadProposalPDF(formData: FormData) {
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
    console.error('Error in uploadProposalPDF:', error)
    return { success: false, error: 'Errore imprevisto' }
  }
}

// Create a new proposal
export async function createProposal(proposalData: {
  title: string
  description: string
  attachmentUrl: string
  verificationId: string
  requestId: string
  requestTitle: string
  requestEmail: string
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verifica che l'OTP sia stato verificato
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('verified_at, email')
      .eq('id', proposalData.verificationId)
      .single()

    if (otpError || !otpData || !otpData.verified_at) {
      return { 
        success: false, 
        error: 'Email non verificata. Completa prima la verifica.' 
      }
    }

    // Crea la proposta
    const insertData: TablesInsert<'proposals'> = {
      title: proposalData.title,
      description: proposalData.description,
      attachment_url: proposalData.attachmentUrl,
      verification_id: proposalData.verificationId,
      request_id: proposalData.requestId,
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating proposal:', error)
      return { 
        success: false, 
        error: 'Errore nella creazione della proposta' 
      }
    }

    // Invia email di notifica al richiedente
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-proposal-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: proposalData.requestEmail,
        requestTitle: proposalData.requestTitle,
        proposalTitle: proposalData.title,
        proposalDescription: proposalData.description,
        proposerEmail: otpData.email,
        attachmentUrl: proposalData.attachmentUrl,
      }),
    })

    if (!emailResponse.ok) {
      console.error('Error sending notification email')
      // Non blocchiamo la creazione se la mail fallisce
    }

    // Log email sent
    await supabase
      .from('log_email_sent')
      .insert({
        metadata: {
          type: 'proposal_created',
          proposal_id: data.id,
          request_id: proposalData.requestId,
          verification_id: proposalData.verificationId,
        }
      })

    return { 
      success: true, 
      data,
      message: 'Proposta inviata con successo' 
    }
  } catch (error) {
    console.error('Error in createProposal:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

