'use server'

import { createServerSupabaseClient } from '@/lib/database/supabase-client'

// Recupera i preventivi dell'utente corrente
export async function getUserQuotes(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

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

// Recupera un singolo preventivo per ID (pubblico, non richiede autenticazione)
export async function getQuoteById(quoteId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
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
