import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fvzaundljfhgvaomdpte.databasepad.com';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBmMzc1YzRlLTE3NzktNDQ1NS04MGZmLWQ2ZDBkNzQ2NGY4YyJ9.eyJwcm9qZWN0SWQiOiJmdnphdW5kbGpmaGd2YW9tZHB0ZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc0ODIwMjU5LCJleHAiOjIwOTAxODAyNTksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.e4zXt0S3H4YSH623ktDGJhv8AKhxnCjZnYn5cO1h-Ps';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };