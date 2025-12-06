# 💅 Сайт маникюрного кабинета - Лена Курганова

**Современный одностраничный сайт для мастера ногтевого сервиса с 21-летним опытом**

![React](https://img.shields.io/badge/react-18%2B-blue)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Framer Motion](https://img.shields.io/badge/framer--motion-animations-purple)
![SCSS](https://img.shields.io/badge/scss-styling-pink)

## ✨ Особенности

- 🎨 **Современный дизайн** с пастельными цветами и градиентами
- 📱 **Полностью адаптивный** для всех устройств
- ⚡ **Плавные анимации** с Framer Motion
- 🧭 **Якорная навигация** по одностраничной структуре
- 📅 **Интерактивный календарь** с расписанием работы
- 💳 **Форма записи** с валидацией
- 🔍 **SEO оптимизация** с метатегами и Open Graph
- 🌐 **Готов к локализации** (i18n ready)

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

## 📦 Архитектура и деплой (актуально)

- **Frontend:** GitHub Pages (бренч `main`, workflow `.github/workflows/deploy.yml`, `base: '/EM/'` в `vite.config.ts`)
  - Secrets (Actions): `VITE_API_URL` (например `https://elena-manicure-api.onrender.com/api`), при необходимости `VITE_ADMIN_*`, `VITE_TELEGRAM_*`.
  - Адрес сайта: `https://antoniozubakha.github.io/EM/`
- **Backend:** Render Web Service (`server/`, Node 18+)
  - Env: `SUPABASE_URL`, `SUPABASE_KEY` (service role), `ADMIN_TOKEN`, `PORT` авто.
  - URL: `https://elena-manicure-api.onrender.com`
- **Хранилище:** Supabase (PostgreSQL)
  - `booked_slots (id, date, time, name, phone, service, booked_at, unique(date,time))`
  - `working_days (date PK, status working/off)`

### Быстрый деплой фронта (GitHub Pages)
1. Добавить секрет `VITE_API_URL` в Settings → Secrets → Actions.
2. Push в `main` → workflow соберёт `dist` и задеплоит.
3. Проверить `https://antoniozubakha.github.io/EM/`.

### Быстрый деплой бэка (Render)
1. Подключить репозиторий, root: `server`.
2. Build: `npm install`; Start: `node index.js`.
3. Env: `SUPABASE_URL`, `SUPABASE_KEY`, `ADMIN_TOKEN`, `PORT` авто.
4. Проверка: `GET /api/health`.

### Supabase
- Создать таблицы через SQL Editor (см. выше).
- Ключи: брать из Settings → API (service role на бэке, anon — только если понадобится на фронте).

### CORS (в `server/index.js`)
- Разрешены: `https://elena-manicure.ru`, `https://www.elena-manicure.ru`, `https://antoniozubakha.github.io`, `http://localhost:5173`, `http://localhost:3050`.

### Assets и базовый путь
- Все пути к статикам/картинкам идут через `import.meta.env.BASE_URL` → важно для `/EM/` на GitHub Pages.

### Домены
- Инструкции по подключению `elena-manicure.ru` и `api.elena-manicure.ru` см. в `DOMAIN_ROADMAP.md`.
