import { config } from 'dotenv';

config();

const RETAILCRM_URL = process.env.RETAILCRM_URL;
const API_KEY = process.env.RETAILCRM_API_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const THRESHOLD = 50000;
const POLL_INTERVAL = 30000; // 30 seconds

if (!RETAILCRM_URL || !API_KEY || !BOT_TOKEN || !CHAT_ID) {
  console.error('Set RETAILCRM_URL, RETAILCRM_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID in .env');
  process.exit(1);
}

const notifiedOrders = new Set();

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Telegram error:', data.description);
  }
  return data.ok;
}

async function fetchRecentOrders() {
  // For demo: fetch all orders. In production, use filter[createdAtFrom] to get only recent ones
  const url = `${RETAILCRM_URL}/api/v5/orders?apiKey=${API_KEY}&limit=50`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    console.error('RetailCRM API error:', data);
    return [];
  }

  return data.orders || [];
}

function getDateFrom() {
  // Look back 1 hour for new orders
  const d = new Date(Date.now() - 60 * 60 * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function calcTotal(order) {
  return (order.items || []).reduce(
    (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1),
    0
  );
}

function getItemName(item) {
  return item.productName || item.offer?.name || 'Товар';
}

function formatOrder(order, total) {
  const items = (order.items || [])
    .map((i) => `  - ${getItemName(i)} x${i.quantity} = ${(i.initialPrice * i.quantity).toLocaleString('ru')} ₸`)
    .join('\n');

  return [
    `<b>Новый крупный заказ!</b>`,
    ``,
    `<b>Сумма: ${total.toLocaleString('ru')} ₸</b>`,
    `Клиент: ${order.firstName} ${order.lastName}`,
    `Телефон: ${order.phone}`,
    `Город: ${order.delivery?.address?.city || '—'}`,
    ``,
    `Товары:`,
    items,
  ].join('\n');
}

const DEMO_LIMIT = 3; // Send only first 3 alerts for demo, then stop polling

async function checkOrders() {
  const orders = await fetchRecentOrders();
  let newAlerts = 0;

  for (const order of orders) {
    const orderId = String(order.id);
    if (notifiedOrders.has(orderId)) continue;

    const total = calcTotal(order);
    if (total > THRESHOLD) {
      console.log(`Order #${orderId}: ${total} ₸ > ${THRESHOLD} ₸ — sending alert`);
      const sent = await sendTelegramMessage(formatOrder(order, total));
      if (sent) {
        notifiedOrders.add(orderId);
        newAlerts++;
      }
      if (notifiedOrders.size >= DEMO_LIMIT) {
        console.log(`\nDemo limit reached (${DEMO_LIMIT} alerts). Stopping.`);
        process.exit(0);
      }
    }
  }

  if (newAlerts === 0) {
    console.log(`[${new Date().toLocaleTimeString()}] No new high-value orders`);
  }
}

async function main() {
  console.log(`=== Telegram Order Alert Bot ===`);
  console.log(`Threshold: ${THRESHOLD.toLocaleString()} ₸`);
  console.log(`Polling every ${POLL_INTERVAL / 1000}s\n`);

  // Initial check
  await checkOrders();

  // Poll loop
  setInterval(checkOrders, POLL_INTERVAL);
}

main();
