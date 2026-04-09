'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Order } from '@/lib/supabase';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

export default function Dashboard({ orders }: { orders: Order[] }) {
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  const highValue = orders.filter((o) => o.total_amount > 50000).length;

  // Orders by city
  const cityMap = new Map<string, number>();
  for (const o of orders) {
    cityMap.set(o.city, (cityMap.get(o.city) || 0) + 1);
  }
  const cityData = Array.from(cityMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Revenue by city
  const cityRevenueMap = new Map<string, number>();
  for (const o of orders) {
    cityRevenueMap.set(o.city, (cityRevenueMap.get(o.city) || 0) + o.total_amount);
  }
  const cityRevenueData = Array.from(cityRevenueMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Orders by UTM source
  const utmMap = new Map<string, number>();
  for (const o of orders) {
    const src = o.utm_source || 'unknown';
    utmMap.set(src, (utmMap.get(src) || 0) + 1);
  }
  const utmData = Array.from(utmMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Orders by price range
  const ranges = [
    { label: '< 20K', min: 0, max: 20000 },
    { label: '20K-40K', min: 20000, max: 40000 },
    { label: '40K-60K', min: 40000, max: 60000 },
    { label: '60K-80K', min: 60000, max: 80000 },
    { label: '80K+', min: 80000, max: Infinity },
  ];
  const rangeData = ranges.map((r) => ({
    name: r.label,
    count: orders.filter((o) => o.total_amount >= r.min && o.total_amount < r.max).length,
  }));

  // Top products
  const productMap = new Map<string, { qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const prev = productMap.get(item.productName) || { qty: 0, revenue: 0 };
      productMap.set(item.productName, {
        qty: prev.qty + item.quantity,
        revenue: prev.revenue + item.initialPrice * item.quantity,
      });
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders Dashboard</h1>
        <p className="text-sm text-gray-500">RetailCRM + Supabase</p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Orders" value={String(orders.length)} />
          <KpiCard title="Total Revenue" value={formatMoney(totalRevenue)} />
          <KpiCard title="Avg Order" value={formatMoney(avgOrder)} />
          <KpiCard title="Orders > 50K ₸" value={String(highValue)} sub={`${orders.length ? Math.round((highValue / orders.length) * 100) : 0}% of total`} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by City */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue by City</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by UTM */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders by Source</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utmData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {utmData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by City */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders by City</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Price Range */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders by Amount</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rangeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Qty Sold</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{p.name}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{p.qty}</td>
                    <td className="py-3 px-4 text-right text-gray-800 font-medium">{formatMoney(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">City</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Source</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400">{o.retailcrm_id}</td>
                    <td className="py-3 px-4 text-gray-800">{o.first_name} {o.last_name}</td>
                    <td className="py-3 px-4 text-gray-600">{o.city}</td>
                    <td className="py-3 px-4 text-gray-600">{o.utm_source}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">{formatMoney(o.total_amount)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
