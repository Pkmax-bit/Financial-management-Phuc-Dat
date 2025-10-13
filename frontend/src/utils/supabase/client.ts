/**
 * Supabase client utility
 * Re-exports the main supabase client for compatibility
 */

import { supabase } from '@/lib/supabase'

export const createClient = () => supabase

// Also export the supabase instance directly
export { supabase }
