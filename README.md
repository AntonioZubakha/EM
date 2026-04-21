# 💅 Сайт маникюрного кабинета - Лена Курганова

**Современный одностраничный сайт для мастера ногтевого сервиса с 21-летним опытом**

![React](https://img.shields.io/badge/react-18%2B-blue)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Framer Motion](https://img.shields.io/badge/framer--motion-animations-purple)
![SCSS](https://img.shields.io/badge/scss-styling-pink)

## ✨ Особенности

- 🎨 **Современный дизайн**: пастельные градиенты, аккуратные карточки, читаемые шрифты
- 📱 **Адаптивность 360px+**: всё сверстано под мобилки, планшеты и десктоп
- ⚡ **Плавные анимации**: Framer Motion без “дёрганья” контента
- 🧭 **Удобная навигация**: якоря + плавный скролл, активное состояние пункта меню
- 📅 **Живой календарь**: рабочие/выходные дни, блокировка слотов по времени и длительности услуги
- 🕒 **Расчёт длительности**: сумма выбранных услуг бронирует нужное число получасовых слотов
- 💳 **Форма записи**: валидация, отправка в Telegram, обработка ошибок
- 🔔 **Telegram-уведомления**: новые заявки падают в канал
- 🔍 **SEO готово**: метатеги, OG/Twitter карточки, JSON-LD (BeautySalon + Person), sitemap/robots
- 🖼️ **Оптимизация изображений**: lazy-load, фиксированные размеры для снижения CLS
- 🛡️ **Админка**: авторизация с автоподстановкой, запоминание входа на 7 дней, ручное закрытие слотов/дней
- 🧩 **Гибкий прайс**: переключатели категорий, мобильные карточки и десктопная таблица
- 🌐 **Бэкенд + Supabase**: API для бронирований, хранение слотов в PostgreSQL, блокировки от гонок
- ⚙️ **CI/CD GitHub Pages**: деплой из main, секреты для API/GA/Telegram в Actions

## 🚀 Быстрый старт

1. **Установите зависимости:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Настройте переменные окружения** (см. `ENV_SETUP.md`)

3. **Запустите проект:**
   ```bash
   # Терминал 1: Frontend
   npm run dev
   
   # Терминал 2: Backend
   npm run server
   ```

4. **Откройте:** http://localhost:3050


## 🛠 Технологии

**Frontend:** React 19, TypeScript, Vite, Framer Motion, SCSS  
**Backend:** Node.js, Express

## 📋 Команды

```bash
npm run dev          # Frontend (порт 3050)
npm run server       # Backend (порт 3001)
npm run build        # Сборка для продакшена
npm run preview      # Предпросмотр сборки
```

## 📦 Архитектура и деплой

### Frontend (GitHub Pages)
- **Хостинг:** GitHub Pages
- **Ветка:** `main` 
- **Workflow:** `.github/workflows/deploy.yml`
- **URL:** `https://elena-manicure.ru/`

**GitHub Secrets (Settings → Secrets → Actions):**
- `VITE_API_URL` - URL вашего бэкенд API (например `http://localhost:3001/api` для разработки)
- `VITE_ADMIN_LOGIN`, `VITE_ADMIN_PASSWORD`, `VITE_ADMIN_TOKEN` - данные для админ-панели
- `VITE_TELEGRAM_BOT_TOKEN`, `VITE_TELEGRAM_CHAT_ID` - для уведомлений в Telegram
- `VITE_GA_ID` - Google Analytics ID

**Деплой:**
```bash
git push origin main  # Автоматический деплой через GitHub Actions
```

### Backend (требует отдельного хостинга)

⚠️ **Важно:** Бэкенд необходим для функциональности бронирования и админ-панели.

**Технологии:**
- Node.js 18+ / Express
- База данных: Supabase (PostgreSQL)

**Переменные окружения для бэкенда:**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
ADMIN_TOKEN=your_secure_admin_token
PORT=3001  # или автоматически от хостинга
```

**Варианты хостинга бэкенда:**

1. **Локальный запуск (для разработки):**
   ```bash
   cd server
   npm install
   # Создайте файл .env с переменными выше
   npm start  # или node index.js
   ```
   API будет доступен на `http://localhost:3001/api`

2. **Бесплатные облачные платформы:**
   - **Railway** (рекомендуется)
   - **Fly.io**
   - **Render** (бесплатный план с холодным стартом)
   - **Vercel** (требует адаптации под serverless)

3. **VPS/Dedicated сервер:**
   - DigitalOcean
   - Linode
   - AWS EC2 / Google Cloud / Azure

**Настройка после деплоя бэкенда:**
1. Скопируйте URL вашего API (например `https://your-api.railway.app/api`)
2. Добавьте его в GitHub Secrets как `VITE_API_URL`
3. Пересоберите фронтенд (push в main)

### База данных (Supabase)

**Создание таблиц (SQL Editor в Supabase):**

```sql
-- Таблица для забронированных слотов
CREATE TABLE booked_slots (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  service TEXT,
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time)
);

-- Таблица для переопределения рабочих дней
CREATE TABLE working_days (
  date TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('working', 'off'))
);

-- Индексы для оптимизации
CREATE INDEX idx_booked_slots_date ON booked_slots(date);
CREATE INDEX idx_booked_slots_date_time ON booked_slots(date, time);
```

**Получение ключей Supabase:**
1. Откройте проект в Supabase
2. Settings → API
3. Скопируйте `URL` и `service_role` key (⚠️ не anon key!)

### CORS настройки

В `server/index.js` уже настроены разрешенные домены:
- `https://elena-manicure.ru`
- `https://www.elena-manicure.ru`
- `https://antoniozubakha.github.io`
- `http://localhost:5173` (Vite dev)
- `http://localhost:3050` (Vite dev)

### 💓 Keep-Alive для Supabase (защита от «засыпания»)

Бесплатный тариф Supabase ставит проект на **паузу после ~7 дней неактивности**
(никаких API/SQL-запросов). Чтобы такого не случалось, в репозитории
настроен автоматический пинг.

**Что работает «из коробки»:**

1. **GitHub Actions cron** — `.github/workflows/keepalive.yml`
   запускается каждый день и делает лёгкий запрос к Supabase REST API
   (`SELECT id FROM booked_slots LIMIT 1`). Этого достаточно, чтобы
   Supabase считал проект активным.
2. **Self-ping в бэкенде** — пока процесс жив, каждые 24 часа он
   сам делает то же самое (см. `server/index.js`, `setInterval`).
3. **Эндпоинт `GET /api/keepalive`** — ручной/внешний пинг, который
   реально ходит в БД и возвращает `{ ok: true, count, at }`.

**Что нужно добавить один раз в GitHub Secrets**
(Settings → Secrets and variables → Actions):

| Secret | Обязательный | Значение |
|---|---|---|
| `SUPABASE_URL` | да | URL проекта, напр. `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | да | `service_role` или `anon` ключ (хватит anon) |
| `KEEPALIVE_API_URL` | нет | полный URL `https://your-api/api/keepalive`, если хотите пинговать и бэкенд |

После этого можно запустить workflow вручную:
`Actions → Supabase Keep-Alive → Run workflow`, чтобы убедиться,
что всё зелёное. Дальше он будет пинговать по расписанию сам.

### Проверка работоспособности

После настройки проверьте:
1. **Frontend:** https://elena-manicure.ru/
2. **Backend Health:** `https://your-api-url/api/health` должен вернуть `{"status":"ok"}`
3. **Backend Keep-Alive:** `https://your-api-url/api/keepalive` должен вернуть `{"status":"ok","ok":true,"count":N}`
4. **Бронирование:** Попробуйте забронировать слот на сайте
5. **Админка:** Войдите в админ-панель и проверьте управление слотами
