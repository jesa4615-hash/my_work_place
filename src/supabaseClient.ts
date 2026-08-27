import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.[https://jjjuhauskraqpfgwpkqe.supabase.co](https://jjjuhauskraqpfgwpkqe.supabase.co)|| '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
