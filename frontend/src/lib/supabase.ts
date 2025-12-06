import { createClient } from '@supabase/supabase-js'

// ⚠️ SECURITY: Get Supabase URL and Anon Key from environment variables only
// No hardcoded credentials - must be set via environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate that we have required values
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please set it in your .env.local file or environment variables.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please set it in your .env.local file or environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)