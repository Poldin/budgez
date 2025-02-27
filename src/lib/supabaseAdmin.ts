import { createClient } from '@supabase/supabase-js'

// Usa le variabili d'ambiente per le credenziali di service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || ''

// Crea il client con la service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
)