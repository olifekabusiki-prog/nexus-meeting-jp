import { createClient } from '@supabase/supabase-js'

/** サーバーサイド専用（service_role）。フロントから絶対に使わない */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
