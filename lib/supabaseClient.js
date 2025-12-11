const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// For backend admin tasks, might need service role key if bypassing RLS, but for now anon is fine for public ops, 
// and we need a way to verify tokens.

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
