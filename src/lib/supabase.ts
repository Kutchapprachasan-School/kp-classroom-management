import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from Vite environment variables or provide fallback
const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper for logging database operations
export const logDbOperation = (operation: string, details?: unknown) => {
  if (env.DEV) {
    console.log(`[Supabase CRUD] ${operation}`, details ?? '');
  }
};
