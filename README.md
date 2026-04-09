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

### Промпт 1: Начало проекта

> у меня есть тестовое задание... Построй мини-дашборд заказов. Используй Claude Code CLI.
> Шаг 1-5: [описание всех шагов]
> аккаунты я создам, остальное на тебе, погнали

Claude Code проанализировал `mock_orders.json` (50 заказов, 12K-105K ₸, 4 города, 5 UTM), спланировал архитектуру и создал все компоненты за одну сессию.

### Что делал Claude Code автоматически:

1. **Анализ данных** — распарсил JSON, определил структуру, ценовые диапазоны, города
2. **Изучил API** — поискал документацию RetailCRM API v5, нашёл эндпоинты
3. **Создал скрипты** — upload, sync, telegram bot с обработкой ошибок и rate limiting
4. **Спроектировал БД** — SQL-схема с индексами и RLS для Supabase
5. **Построил дашборд** — Next.js 16 + Recharts с KPI, графиками и таблицами
6. **Исправил ошибки** — Next.js 16 не поддерживает `ssr: false` в Server Components, TypeScript типы Recharts

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
