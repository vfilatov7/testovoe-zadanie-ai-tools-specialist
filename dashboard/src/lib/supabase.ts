import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Order {
  id: number;
  retailcrm_id: string;
  external_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: string;
  city: string;
  address_text: string;
  utm_source: string;
  total_amount: number;
  items: { productName: string; quantity: number; initialPrice: number }[];
  created_at: string;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  return data || [];
}
