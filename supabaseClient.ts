import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
// We check import.meta.env (Vite) and fallback to provided keys
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://iuxtkcnpxejwhckltoml.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eHRrY25weGVqd2hja2x0b21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDExNzksImV4cCI6MjA4NTA3NzE3OX0.EAsjS07m4qJYTIm9m4LilsVnwkN7Y9tj9udVNj6f0bU';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.error(
    '⚠️ Supabase credentials missing! Please update the .env file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
