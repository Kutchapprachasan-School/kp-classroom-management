import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from Vite environment variables or provide fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper for logging database operations
export const logDbOperation = (operation: string, details?: unknown) => {
  if (import.meta.env.DEV) {
    console.log(`[Supabase CRUD] ${operation}`, details ?? '');
  }
};
