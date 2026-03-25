import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zitrcqplierpbdgmcjek.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_FKjmaqpDHVDFg7A2DGBi8Q_vO5wAMKc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
