import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Browser client: stores the session in cookies (not just localStorage) so the
// middleware can read it via request.cookies and allow protected routes.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (bypasses RLS, used in API routes only)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
  )
}

export const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001'
