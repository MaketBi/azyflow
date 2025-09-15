import { createClient } from '@supabase/supabase-js';
import { Database } from './database';

// --- Frontend client (browser only) ---
// Usage: React components, client-side code
// Uses public anon key, safe for browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// --- Server-side client (Node.js/Edge/Next.js API routes only) ---
// Usage: backend code, API routes, Edge Functions
// Uses service_role key, NEVER expose in browser
// Only initialize if process.env.SUPABASE_SERVICE_ROLE_KEY is available
let supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined = undefined;
if (typeof process !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
export { supabaseAdmin };