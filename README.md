# Mini Orders Dashboard

Тестовое задание AI Tools Specialist: мини-дашборд заказов с интеграциями RetailCRM, Supabase, Vercel, Telegram.

## Архитектура

```
mock_orders.json ──> RetailCRM ──> Supabase ──> Next.js Dashboard (Vercel)
                         │
                         └──> Telegram Bot (уведомления > 50K ₸)
```

## Быстрый старт

### 1. Настрой окружение

```bash
cp .env.example .env
# Заполни переменные в .env
```

### 2. Создай таблицу в Supabase

Открой SQL Editor в Supabase и выполни `supabase-schema.sql`.

### 3. Загрузи заказы в RetailCRM

```bash
npm install
npm run upload
```

### 4. Синхронизируй в Supabase

```bash
npm run sync
```

### 5. Запусти дашборд локально

```bash
cd dashboard
cp .env.local.example .env.local
# Заполни NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 6. Деплой на Vercel

```bash
cd dashboard
npx vercel --prod
# Или подключи GitHub-репо в Vercel Dashboard
# В настройках проекта добавь Environment Variables:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 7. Запусти Telegram-бот

```bash
# Получи chat_id: отправь боту /start, затем:
# curl https://api.telegram.org/bot<TOKEN>/getUpdates
npm run bot
```

## Структура проекта

```
├── mock_orders.json           # 50 тестовых заказов
├── supabase-schema.sql        # SQL-схема для Supabase
├── scripts/
│   ├── upload-to-retailcrm.mjs  # Загрузка заказов в RetailCRM
│   ├── sync-to-supabase.mjs     # Синхронизация RetailCRM → Supabase
│   └── telegram-bot.mjs         # Telegram-бот уведомлений
├── dashboard/                   # Next.js дашборд
│   └── src/
│       ├── lib/supabase.ts      # Supabase клиент
│       └── app/
│           ├── page.tsx         # Server component (fetch данных)
│           └── components/
│               └── Dashboard.tsx # Client component (графики)
└── .env.example                 # Шаблон переменных окружения
```

## Дашборд: что показывает

- **KPI-карточки**: общее число заказов, выручка, средний чек, заказы > 50K
- **Revenue by City**: столбчатая диаграмма выручки по городам
- **Orders by Source**: круговая диаграмма заказов по UTM-источникам
- **Orders by City**: количество заказов по городам
- **Orders by Amount**: распределение заказов по ценовым диапазонам
- **Top Products**: таблица товаров по выручке
- **Recent Orders**: таблица последних заказов

## Telegram-бот

Поллинг RetailCRM каждые 30 секунд. При появлении заказа на сумму > 50,000 ₸ отправляет уведомление с деталями: клиент, сумма, город, товары.

## Стек

- **RetailCRM API v5** — CRM для заказов
- **Supabase** (PostgreSQL) — хранилище данных для дашборда
- **Next.js 16** + **Recharts** + **Tailwind CSS** — дашборд
- **Vercel** — хостинг дашборда
- **Telegram Bot API** — уведомления

## Промпты Claude Code

Ниже — ключевые промпты, которые давались Claude Code для создания проекта.

### Промпт 1: Планирование архитектуры

> Проанализируй mock_orders.json — определи структуру данных, ценовые диапазоны, города, UTM-источники.
> На основе анализа спроектируй архитектуру ETL-пайплайна: mock_orders → RetailCRM API v5 → Supabase (PostgreSQL) → Next.js дашборд на Vercel.
> Учти: RetailCRM API использует form-urlencoded, лимит 10 req/sec. Supabase нужна RLS-политика для анонимного чтения. Дашборд должен использовать ISR для кэширования.

### Промпт 2: Скрипт загрузки в RetailCRM

> Напиши Node.js скрипт для загрузки 50 заказов из mock_orders.json в RetailCRM через API v5.
> Требования: externalId для идемпотентности, rate limiting 100ms между запросами, параметр site для мультимагазинных аккаунтов.
> Сначала запроси справочники через /reference/order-types и /reference/sites, чтобы маппить типы заказов корректно.

### Промпт 3: ETL синхронизация RetailCRM → Supabase

> Создай скрипт синхронизации с паттерном Extract-Transform-Load:
> Extract — пагинация по RetailCRM API (limit=50 на страницу).
> Transform — денормализация: вычислить total_amount, вытащить city из delivery.address.city, utm_source из customFields. Fallback на mock_orders.json для UTM, так как RetailCRM не хранит незарегистрированные customFields.
> Load — upsert в Supabase по retailcrm_id для идемпотентности.

### Промпт 4: Next.js дашборд

> Построй дашборд на Next.js 16 + Recharts + Tailwind CSS.
> Архитектура: Server Component (page.tsx) для fetch данных из Supabase, Client Component (Dashboard.tsx) для графиков.
> Графики: Revenue by City (BarChart), Orders by Source (PieChart), Orders by Amount (гистограмма по диапазонам), Top Products (таблица).
> KPI-карточки: total orders, revenue, avg order, orders > 50K.
> ISR с revalidate=60 для кэширования. Деплой на Vercel с env vars через `vercel env add`.

### Промпт 5: Telegram-бот уведомлений

> Напиши polling-бот: каждые 30 секунд опрашивает RetailCRM, при появлении заказа > 50,000 ₸ отправляет HTML-сообщение в Telegram с деталями (клиент, сумма, город, список товаров).
> Дедупликация через Set — не уведомлять повторно. Учти что RetailCRM возвращает имя товара в offer.name, а не productName.

### Что делал Claude Code автоматически:

1. **Анализ данных** — распарсил JSON, определил структуру (50 заказов, 12K-105K ₸, 4 города, 5 UTM)
2. **Изучил API** — нашёл документацию RetailCRM API v5, проверил эндпоинты и справочники
3. **Создал скрипты** — upload, sync, telegram bot с обработкой ошибок и rate limiting
4. **Спроектировал БД** — SQL-схема с индексами и RLS для Supabase
5. **Построил дашборд** — Next.js 16 + Recharts с KPI, графиками и таблицами
6. **Задеплоил** — Vercel CLI с environment variables для production

### Где застрял и как решил:

- **Next.js 16 breaking change**: `dynamic()` с `ssr: false` запрещён в Server Components. Решение: прямой импорт клиентского компонента с `'use client'` директивой.
- **Recharts TypeScript типы**: `Tooltip formatter` требует другую сигнатуру в новой версии. Решение: `Number(v)` вместо типизации параметра как `number`.
- **RetailCRM API формат**: API принимает `application/x-www-form-urlencoded`, не JSON. Параметр `order` — JSON-строка в form data.
- **RetailCRM `site` параметр**: когда API-ключ привязан к нескольким магазинам, нужно указывать `site`. Узнали через `/reference/sites`.
- **RetailCRM `orderType`**: в mock-данных `eshop-individual`, а в CRM только `main`. Узнали через `/reference/order-types`.
- **RetailCRM `customFields`**: кастомные поля игнорируются, если не созданы в настройках CRM. Решение: data enrichment из mock_orders.json.
- **RetailCRM `items` формат**: при создании — `productName`, при чтении — `offer.name`. Нужно обрабатывать оба варианта.
- **Telegram `chat_id`**: нельзя отправить сообщение, пока пользователь не написал `/start`. ID получаем через `getUpdates`.

## Ссылки

- **Дашборд**: https://dashboard-tau-sooty.vercel.app
- **Скриншот Telegram**: [добавить скриншот]
