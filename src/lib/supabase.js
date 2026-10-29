import { createClient } from '@supabase/supabase-js';

// Cấu hình kết nối Supabase trực tiếp đến dự án trường học
const DEFAULT_SUPABASE_URL = 'https://vvlzcmqzskshvilwcyfg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHpjbXF6c2tzaHZpbHdjeWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTA3MzYsImV4cCI6MjEwODc2NjczNn0.Gt2WB-raFFT0siuIF5vWZ7-dMySK2xPQDmAt46drbCo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project-id')
);

// Khởi tạo Supabase Client duy nhất (Singleton Pattern)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
