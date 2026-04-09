import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const RETAILCRM_URL = process.env.RETAILCRM_URL;
const API_KEY = process.env.RETAILCRM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!RETAILCRM_URL || !API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set RETAILCRM_URL, RETAILCRM_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Load mock data to enrich with UTM sources (RetailCRM doesn't store
// custom fields unless they're pre-configured in CRM settings)
const mockOrders = JSON.parse(readFileSync('mock_orders.json', 'utf-8'));
const utmByExternalId = new Map();
mockOrders.forEach((o, i) => {
  utmByExternalId.set(`mock-${i + 1}`, o.customFields?.utm_source || '');
});

async function fetchOrdersFromRetailCRM() {
  const allOrders = [];
  let page = 1;

  while (true) {
    const url = `${RETAILCRM_URL}/api/v5/orders?apiKey=${API_KEY}&limit=50&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      console.error('RetailCRM API error:', data);
      break;
    }

    allOrders.push(...data.orders);
    console.log(`Fetched page ${page}: ${data.orders.length} orders`);

    if (page >= data.pagination.totalPageCount) break;
    page++;

    await new Promise((r) => setTimeout(r, 100));
  }

  return allOrders;
}

function transformOrder(order) {
  const totalAmount = (order.items || []).reduce(
    (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1),
    0
  );

  return {
    retailcrm_id: String(order.id),
    external_id: order.externalId || null,
    first_name: order.firstName || '',
    last_name: order.lastName || '',
    phone: order.phone || '',
    email: order.email || '',
    status: order.status || '',
    city: order.delivery?.address?.city || '',
    address_text: order.delivery?.address?.text || '',
    utm_source: order.customFields?.utm_source || utmByExternalId.get(order.externalId) || '',
    total_amount: totalAmount,
    items: order.items || [],
    created_at: order.createdAt || new Date().toISOString(),
  };
}

async function upsertToSupabase(orders) {
  const rows = orders.map(transformOrder);

  const { data, error } = await supabase
    .from('orders')
    .upsert(rows, { onConflict: 'retailcrm_id' });

  if (error) {
    console.error('Supabase upsert error:', error);
    return 0;
  }

  return rows.length;
}

async function main() {
  console.log('=== RetailCRM -> Supabase Sync ===\n');

  console.log('Step 1: Fetching orders from RetailCRM...');
  const orders = await fetchOrdersFromRetailCRM();
  console.log(`Total orders fetched: ${orders.length}\n`);

  if (orders.length === 0) {
    console.log('No orders to sync.');
    return;
  }

  console.log('Step 2: Upserting to Supabase...');
  const count = await upsertToSupabase(orders);
  console.log(`Synced ${count} orders to Supabase.\n`);

  console.log('Done!');
}

main();
