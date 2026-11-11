import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error('Supabase is not set up. Copy admin/.env.example to admin/.env and fill it in.')

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
