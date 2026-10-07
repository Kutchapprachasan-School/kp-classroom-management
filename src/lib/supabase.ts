import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from Vite environment variables or process.env or fallback
const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : typeof globalThis !== 'undefined' && (globalThis as any).process?.env
    ? (globalThis as any).process.env
    : {};
const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://ngzflajpifmsvhldhviu.supabase.co';
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
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
