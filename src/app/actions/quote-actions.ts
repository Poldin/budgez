'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/database/supabase-client'

// Recupera i preventivi dell'utente corrente
export async function getUserQuotes(userId: string, filter?: 'all' | 'expired' | 'notExpired' | 'signed') {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()
    
    let query = supabase
      .from('quotes')
      .select(`
        *,
        otp_verification:verification_id (
          email,
          verified_at
        )
      `)
      .eq('user_id', userId)

    // Applica filtri in base al parametro
    switch (filter) {
      case 'expired':
        // Scaduti: deadline < now() AND verification_id IS NULL AND deadline IS NOT NULL
        query = query
          .lt('deadline', now)
          .is('verification_id', null)
          .not('deadline', 'is', null)
        break
      case 'notExpired':
        // Non scaduti: deadline >= now() AND verification_id IS NULL AND deadline IS NOT NULL
        query = query
          .gte('deadline', now)
          .is('verification_id', null)
          .not('deadline', 'is', null)
        break
      case 'signed':
        // Firmati: verification_id IS NOT NULL
        query = query
          .not('verification_id', 'is', null)
        break
      case 'all':
      default:
        // Nessun filtro aggiuntivo
        break
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quotes:', error)
      return { 
        success: false, 
        error: 'Errore nel recupero dei preventivi' 
      }
    }

    return { 
      success: true, 
      data: data || [] 
    }
  } catch (error) {
    console.error('Error in getUserQuotes:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Recupera le statistiche mensili dei preventivi (2 mesi fa, mese scorso, mese attuale)
export async function getMonthlyStats(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    
    // Calcola le date di inizio e fine per ogni mese
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
    
    // Funzione helper per contare preventivi creati e firmati in un periodo
    const getStatsForPeriod = async (startDate: Date, endDate: Date) => {
      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()
      
      // Conta preventivi creati nel periodo
      const { count: created, error: createdError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
      
      // Conta preventivi firmati nel periodo (verification_id non null E created_at nel periodo)
      const { count: signed, error: signedError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('verification_id', 'is', null)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
      
      if (createdError || signedError) {
        console.error('Error fetching monthly stats:', { createdError, signedError })
        return { created: 0, signed: 0, conversionRate: 0 }
      }
      
      const createdCount = created || 0
      const signedCount = signed || 0
      const conversionRate = createdCount > 0 ? Math.round((signedCount / createdCount) * 100) : 0
      
      return { created: createdCount, signed: signedCount, conversionRate }
    }
    
    // Recupera statistiche per ogni mese
    const [twoMonthsAgo, lastMonth, currentMonth] = await Promise.all([
      getStatsForPeriod(twoMonthsAgoStart, twoMonthsAgoEnd),
      getStatsForPeriod(lastMonthStart, lastMonthEnd),
      getStatsForPeriod(currentMonthStart, currentMonthEnd)
    ])
    
    return {
      success: true,
      data: {
        twoMonthsAgo,
        lastMonth,
        currentMonth
      }
    }
  } catch (error) {
    console.error('Error in getMonthlyStats:', error)
    return {
      success: false,
      error: 'Errore imprevisto',
      data: {
        twoMonthsAgo: { created: 0, signed: 0, conversionRate: 0 },
        lastMonth: { created: 0, signed: 0, conversionRate: 0 },
        currentMonth: { created: 0, signed: 0, conversionRate: 0 }
      }
    }
  }
}

// Recupera i contatori dei preventivi per tutti i filtri
export async function getQuoteCounts(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()
    
    // Conta tutti i preventivi
    const { count: allCount, error: allError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Conta i preventivi scaduti (deadline < now() AND verification_id IS NULL AND deadline IS NOT NULL)
    const { count: expiredCount, error: expiredError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lt('deadline', now)
      .is('verification_id', null)
      .not('deadline', 'is', null)

    // Conta i preventivi non scaduti (deadline >= now() AND verification_id IS NULL AND deadline IS NOT NULL)
    const { count: notExpiredCount, error: notExpiredError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('deadline', now)
      .is('verification_id', null)
      .not('deadline', 'is', null)

    // Conta i preventivi firmati (verification_id IS NOT NULL)
    const { count: signedCount, error: signedError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('verification_id', 'is', null)

    if (allError || expiredError || notExpiredError || signedError) {
      console.error('Error fetching quote counts:', { allError, expiredError, notExpiredError, signedError })
      return {
        success: false,
        error: 'Errore nel recupero dei contatori'
      }
    }

    return {
      success: true,
      data: {
        all: allCount || 0,
        expired: expiredCount || 0,
        notExpired: notExpiredCount || 0,
        signed: signedCount || 0
      }
    }
  } catch (error) {
    console.error('Error in getQuoteCounts:', error)
    return {
      success: false,
      error: 'Errore imprevisto'
    }
  }
}

// Recupera un singolo preventivo per ID (pubblico, non richiede autenticazione)
export async function getQuoteById(quoteId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        otp_verification:verification_id (
          email,
          verified_at
        )
      `)
      .eq('id', quoteId)
      .single()

    if (error) {
      console.error('Error fetching quote:', error)
      return { 
        success: false, 
        error: 'Preventivo non trovato' 
      }
    }

    return { 
      success: true, 
      data: data 
    }
  } catch (error) {
    console.error('Error in getQuoteById:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Aggiorna un preventivo con verification_id per la firma OTP
export async function signQuoteWithOTP(quoteId: string, verificationId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verifica che l'OTP sia stato verificato
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('id', verificationId)
      .single()

    if (otpError || !otpData) {
      return { 
        success: false, 
        error: 'Verifica OTP non trovata' 
      }
    }

    if (!otpData.verified_at) {
      return { 
        success: false, 
        error: 'OTP non ancora verificato' 
      }
    }

    // Recupera il preventivo completo per ottenere user_id e nome
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('user_id, name, metadata')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quoteData) {
      console.error('Error fetching quote:', quoteError)
      return { 
        success: false, 
        error: 'Preventivo non trovato' 
      }
    }

    // Aggiorna il quote con verification_id
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ verification_id: verificationId })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Error updating quote:', updateError)
      return { 
        success: false, 
        error: 'Errore nell\'aggiornamento del preventivo' 
      }
    }

    // Invia email di notifica al possessore del preventivo (se user_id è presente)
    if (quoteData.user_id) {
      try {
        // Recupera l'email dell'utente usando admin client
        const adminClient = createAdminSupabaseClient()
        
        let ownerEmail: string | null = null
        
        if (adminClient) {
          // Usa admin client per recuperare l'email dall'auth.users
          const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(quoteData.user_id)
          
          if (!userError && userData?.user?.email) {
            ownerEmail = userData.user.email
          }
        }

        // Se abbiamo l'email del possessore, invia la notifica
        if (ownerEmail) {
          const quoteName = quoteData.name || (quoteData.metadata as any)?.budgetName || 'Preventivo'
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
          const metadata = quoteData.metadata as any || {}
          
          // Prepara i dati per il certificato
          const certificateData = {
            resources: metadata.resources || [],
            activities: metadata.activities || [],
            generalDiscount: metadata.generalDiscount || { enabled: false, type: 'percentage', value: 0, applyOn: 'taxable' },
            currency: metadata.currency || '€',
            companyName: metadata.pdfConfig?.companyName,
            companyInfo: metadata.pdfConfig?.companyInfo,
          }
          
          // Chiama l'API per inviare l'email (non blocchiamo se fallisce)
          try {
            await fetch(`${siteUrl}/api/send-quote-signature-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: ownerEmail,
                quoteName,
                quoteId,
                signerEmail: otpData.email,
                signedAt: otpData.verified_at,
                certificateData,
              }),
            })
          } catch (emailError) {
            // Non blocchiamo il processo se l'invio email fallisce
            console.error('Error sending signature notification email:', emailError)
          }
        }
      } catch (notificationError) {
        // Non blocchiamo il processo se la notifica fallisce
        console.error('Error preparing signature notification:', notificationError)
      }
    }

    return { 
      success: true,
      email: otpData.email,
      verifiedAt: otpData.verified_at
    }
  } catch (error) {
    console.error('Error in signQuoteWithOTP:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Elimina un singolo preventivo
export async function deleteQuote(quoteId: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', userId) // Verifica che il preventivo appartenga all'utente

    if (error) {
      console.error('Error deleting quote:', error)
      return { 
        success: false, 
        error: 'Errore nell\'eliminazione del preventivo' 
      }
    }

    return { 
      success: true 
    }
  } catch (error) {
    console.error('Error in deleteQuote:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Elimina i preventivi dell'utente prima dell'eliminazione account
export async function deleteUserQuotes(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting quotes:', error)
      return { 
        success: false, 
        error: 'Errore nell\'eliminazione dei preventivi' 
      }
    }

    return { 
      success: true 
    }
  } catch (error) {
    console.error('Error in deleteUserQuotes:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto' 
    }
  }
}

// Recupera i template filtrati per tag e ricerca
export async function getTemplates(filters?: {
  tags?: string[];
  search?: string;
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Ottieni il conteggio totale prima di filtrare
    const { count: totalCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('is_template', true)
      .is('user_id', null)

    let query = supabase
      .from('quotes')
      .select('*')
      .eq('is_template', true)
      .is('user_id', null)

    // Filtra per tag se forniti
    if (filters?.tags && filters.tags.length > 0) {
      // Usa una query che verifica se almeno uno dei tag è presente nell'array tags del metadata
      // PostgreSQL JSONB: verifica se l'array tags contiene almeno uno dei tag richiesti
      const tagConditions = filters.tags.map(tag => 
        `metadata->'tags' @> '["${tag}"]'`
      ).join(' OR ')
      
      // Usa RPC o filtra manualmente dopo la query
      // Per ora filtriamo dopo aver recuperato i dati
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching templates:', error)
      return { 
        success: false, 
        error: 'Errore nel recupero dei template' 
      }
    }

    // Filtra i risultati per tag e ricerca
    let filteredData = data || []
    const totalInDb = totalCount || 0

    // Filtra per tag
    if (filters?.tags && filters.tags.length > 0) {
      filteredData = filteredData.filter((template: any) => {
        const templateTags = template.metadata?.tags || []
        return filters.tags!.some(tag => templateTags.includes(tag))
      })
    }

    // Filtra per ricerca
    if (filters?.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter((template: any) => {
        const name = (template.name || '').toLowerCase()
        const description = (template.metadata?.description || '').toLowerCase()
        const tags = (template.metadata?.tags || []).map((t: string) => t.toLowerCase())
        
        return name.includes(searchLower) || 
               description.includes(searchLower) ||
               tags.some((t: string) => t.includes(searchLower))
      })
    }

    // Trasforma i dati nel formato BudgetTemplate
    const templates = filteredData.map((template: any) => ({
      id: template.metadata?.id || template.id,
      name: template.name || '',
      description: template.metadata?.description || '',
      tags: template.metadata?.tags || [],
      config: template.metadata?.config || {}
    }))

    return { 
      success: true, 
      data: templates,
      totalInDb 
    }
  } catch (error) {
    console.error('Error in getTemplates:', error)
    return { 
      success: false, 
      error: 'Errore imprevisto',
      totalInDb: 0
    }
  }
}
