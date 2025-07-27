import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Só criar cliente se as variáveis estiverem definidas
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log para debug
if (!supabase) {
  console.warn('Supabase não configurado - usando modo offline');
}

// Tipos para TypeScript
export interface ManualStudent {
  id: string;
  name: string;
  email: string;
  notes?: string;
  added_by: string;
  added_at: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateStudentData {
  name: string;
  email: string;
  notes?: string;
  added_by: string;
}