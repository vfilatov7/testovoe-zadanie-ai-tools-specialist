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

> **Примечание:** для тестового задания реализован polling — бот сам опрашивает RetailCRM на наличие новых заказов. В продакшне лучше настроить **webhook-триггер** в самой CRM — тогда RetailCRM будет сам отправлять уведомление при создании заказа, без задержек и лишних запросов.

## Стек

- **RetailCRM API v5** — CRM для заказов
- **Supabase** (PostgreSQL) — хранилище данных для дашборда
- **Next.js 16** + **Recharts** + **Tailwind CSS** — дашборд
- **Vercel** — хостинг дашборда
- **Telegram Bot API** — уведомления

## Промпты Claude Code

Ниже — ключевые промпты, которые давались Claude Code в процессе работы.

### Промпт 1: Старт проекта

> Посмотри mock_orders.json, разберись что там за данные. Спланируй как будем всё делать: загрузка в RetailCRM, потом в Supabase, дашборд на Vercel, и Telegram-бот. Аккаунты я создам сам, от тебя — весь код и скрипты.

### Промпт 2: Загрузка в RetailCRM

> Напиши скрипт который загрузит все 50 заказов в RetailCRM через API. Не забудь про лимиты API. Если что-то пойдёт не так — выводи понятные ошибки.

Дальше пошли уточняющие промпты, когда RetailCRM ругался на отсутствие параметров:

> Ошибка "Parameter 'site' is missing" — разберись какие магазины есть в моём аккаунте и подставь нужный.

> Тип заказа "eshop-individual" не существует — посмотри какие типы доступны через API и исправь.

### Промпт 3: Синхронизация в Supabase

> Напиши скрипт: забери все заказы из RetailCRM и положи в Supabase. Нужна таблица с нормальными полями — город, сумма, UTM отдельными колонками, чтобы потом удобно строить графики. Если запущу скрипт повторно — не должно быть дубликатов.

### Промпт 4: Дашборд

> Сделай красивый дашборд на Next.js с графиками. Хочу видеть: выручку по городам, откуда приходят заказы (UTM), распределение по суммам, топ товаров, и таблицу последних заказов. Сверху — карточки с основными цифрами. Данные бери из Supabase. Потом задеплоим на Vercel.

### Промпт 5: Telegram-бот

> Сделай бота который следит за новыми заказами в RetailCRM — если сумма больше 50 000 ₸, шли уведомление в Telegram с информацией о заказе. Пока для теста сделай через polling, в будущем можно будет повесить webhook в CRM.

### Что Claude Code делал сам (без дополнительных указаний):

1. Распарсил JSON и вывел статистику — сколько заказов, разброс цен, города, UTM-источники
2. Нашёл документацию RetailCRM API, разобрался с форматом запросов
3. Добавил паузы между запросами (rate limiting), чтобы API не блокировал
4. Сам придумал externalId для защиты от дубликатов
5. Спроектировал SQL-схему с индексами и правами доступа
6. Настроил кэширование страницы (обновление раз в минуту)
7. Задеплоил на Vercel через CLI

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
