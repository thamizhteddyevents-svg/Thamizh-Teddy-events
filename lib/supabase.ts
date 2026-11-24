import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// True once both public Supabase env vars are set. Pages use this to show a
// "not configured" notice instead of failing when the site has no Supabase setup.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

function getClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
      )
    }

    client = createClient(supabaseUrl, supabaseKey)
  }
  return client
}

// Created lazily on first use so that importing this module (e.g. while Next.js
// prerenders pages at build time) never crashes when env vars are absent.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(getClient(), prop)
    return typeof value === 'function' ? value.bind(getClient()) : value
  },
})
