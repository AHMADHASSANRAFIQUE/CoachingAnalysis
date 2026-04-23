import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables! Check your .env file or Vercel settings.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export { supabase };