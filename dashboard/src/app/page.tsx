import { fetchOrders } from '@/lib/supabase';
import Dashboard from './components/Dashboard';

export const revalidate = 60;

export default async function Page() {
  const orders = await fetchOrders();

  return <Dashboard orders={orders} />;
}
