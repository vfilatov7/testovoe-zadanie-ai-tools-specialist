import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const RETAILCRM_URL = process.env.RETAILCRM_URL;
const API_KEY = process.env.RETAILCRM_API_KEY;

if (!RETAILCRM_URL || !API_KEY) {
  console.error('Set RETAILCRM_URL and RETAILCRM_API_KEY in .env');
  process.exit(1);
}

const orders = JSON.parse(readFileSync('mock_orders.json', 'utf-8'));

async function createOrder(orderData, index) {
  const order = {
    externalId: `mock-${index + 1}`,
    firstName: orderData.firstName,
    lastName: orderData.lastName,
    phone: orderData.phone,
    email: orderData.email,
    orderType: 'main',
    orderMethod: orderData.orderMethod,
    status: orderData.status,
    items: orderData.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      initialPrice: item.initialPrice,
    })),
    delivery: {
      address: {
        city: orderData.delivery.address.city,
        text: orderData.delivery.address.text,
      },
    },
    customFields: orderData.customFields,
  };

  const params = new URLSearchParams();
  params.append('site', 'testovoe-zadanie');
  params.append('order', JSON.stringify(order));

  const url = `${RETAILCRM_URL}/api/v5/orders/create?apiKey=${API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (!data.success) {
    console.error(`[${index + 1}] Error:`, JSON.stringify(data));
    return false;
  }

  console.log(`[${index + 1}/50] Created order #${data.id} (${orderData.firstName} ${orderData.lastName})`);
  return true;
}

async function main() {
  console.log(`Uploading ${orders.length} orders to RetailCRM...`);
  console.log(`URL: ${RETAILCRM_URL}\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < orders.length; i++) {
    try {
      const ok = await createOrder(orders[i], i);
      if (ok) success++;
      else fail++;
    } catch (err) {
      console.error(`[${i + 1}] Network error:`, err.message);
      fail++;
    }

    // Rate limit: max 10 req/sec, use 100ms delay to be safe
    if (i < orders.length - 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${fail}`);
}

main();
