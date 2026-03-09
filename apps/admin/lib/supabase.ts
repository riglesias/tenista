import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

export const supabase = createClient(supabaseUrl, supabaseKey)