import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// Client per operazioni server-side con service role (da usare solo in server actions/API routes)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Singleton client per operazioni client-side (riutilizzabile)
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function createClientSupabaseClient() {
  if (clientSupabaseInstance) {
    return clientSupabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  clientSupabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return clientSupabaseInstance
}

