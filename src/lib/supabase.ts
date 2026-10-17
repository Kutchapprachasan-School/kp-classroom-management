import { createClient } from '@supabase/supabase-js';
import { neonClient, isNeonConfigured } from './neonClient.ts';

// Load environment variables safely across Vite and Node runtimes
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

// Neon PostgreSQL is the primary, active database destination
export const isSupabaseConfigured = isNeonConfigured || Boolean(supabaseUrl && supabaseAnonKey);

const fallbackClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Proxy client routing all database CRUD operations directly to Neon PostgreSQL
export const supabase = {
  ...fallbackClient,
  from: (table: string) => neonClient.from(table),
  channel: (_name: string) => neonClient.channel(_name),
  removeChannel: (_channel: any) => neonClient.removeChannel(_channel),
};

// Helper for logging database operations
export const logDbOperation = (operation: string, details?: unknown) => {
  if (env.DEV) {
    console.log(`[Neon Database CRUD] ${operation}`, details ?? '');
  }
};
