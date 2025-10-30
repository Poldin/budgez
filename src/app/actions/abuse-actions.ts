'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client';

export interface ReportAbuseParams {
  requestId: string;
  reason: string;
  verificationId: string;
}

export async function reportAbuse(params: ReportAbuseParams) {
  try {
    const supabase = createServerSupabaseClient();

    // Verify that the verification_id exists and is verified
    const { data: verification, error: verificationError } = await supabase
      .from('otp_verification')
      .select('id, verified_at')
      .eq('id', params.verificationId)
      .single();

    if (verificationError || !verification) {
      return {
        success: false,
        error: 'Verifica email non valida',
      };
    }

    if (!verification.verified_at) {
      return {
        success: false,
        error: 'Email non verificata',
      };
    }

    // Check if the request exists
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('id')
      .eq('id', params.requestId)
      .single();

    if (requestError || !request) {
      return {
        success: false,
        error: 'Richiesta non trovata',
      };
    }

    // Insert the abuse report
    const { error: insertError } = await supabase
      .from('request_abuses')
      .insert({
        request_id: params.requestId,
        reason: params.reason,
        verification_id: params.verificationId,
      });

    if (insertError) {
      console.error('Error inserting abuse report:', insertError);
      return {
        success: false,
        error: 'Errore nel salvataggio della segnalazione',
      };
    }

    return {
      success: true,
      message: 'Segnalazione inviata con successo',
    };
  } catch (error) {
    console.error('Error in reportAbuse:', error);
    return {
      success: false,
      error: 'Errore imprevisto',
    };
  }
}

