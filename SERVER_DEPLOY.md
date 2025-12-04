# 🚀 Деплой сервера для управления записями

## Архитектура

Проект состоит из двух частей:
1. **Frontend** (React + Vite) - статический сайт
2. **Backend** (Node.js + Express) - API для управления записями

## Структура проекта

```
manikur/
├── src/              # Frontend (React)
├── server/           # Backend (Node.js/Express)
│   ├── index.js      # Сервер API
│   ├── data/         # Данные (bookedSlots.json)
│   └── package.json  # Зависимости сервера
└── dist/             # Собранный frontend
```

## Установка и запуск

### 1. Установка зависимостей

```bash
# Установка зависимостей frontend (если еще не установлены)
npm install

# Установка зависимостей backend
cd server
npm install
cd ..
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Frontend
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
VITE_API_URL=http://localhost:3001/api

# Backend (опционально)
PORT=3001
```

### 3. Запуск в режиме разработки

**Вариант 1: Запуск отдельно**

```bash
# Терминал 1: Frontend
npm run dev

# Терминал 2: Backend
npm run server
```

**Вариант 2: С помощью concurrently (если установлен)**

```bash
npm run dev:full
```

### 4. Проверка работы

- Frontend: http://localhost:3050
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

## API Endpoints

### GET `/api/booked-slots`
Получить все занятые слоты

**Ответ:**
```json
{
  "bookedSlots": [
    {
      "date": "2025-01-07",
      "time": "14:00",
      "name": "Имя клиента",
      "phone": "+79161234567",
      "service": "Маникюр",
      "bookedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### GET `/api/booked-slots/:date`
Получить занятые слоты на конкретную дату

**Пример:** `GET /api/booked-slots/2025-01-07`

**Ответ:**
```json
{
  "times": ["14:00", "16:00"]
}
```

### POST `/api/booked-slots`
Добавить новую запись

**Тело запроса:**
```json
{
  "date": "2025-01-07",
  "time": "14:00",
  "name": "Имя клиента",
  "phone": "+79161234567",
  "service": "Маникюр"
}
```

**Ответ:**
```json
{
  "success": true,
  "slot": {
    "date": "2025-01-07",
    "time": "14:00",
    "name": "Имя клиента",
    "phone": "+79161234567",
    "service": "Маникюр",
    "bookedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### DELETE `/api/booked-slots/:date/:time`
Удалить запись

**Пример:** `DELETE /api/booked-slots/2025-01-07/14:00`

**Ответ:**
```json
{
  "success": true
}
```

## Деплой на сервер

### Вариант 1: Отдельный сервер (рекомендуется)

1. **Frontend** (статический сайт):
   - Соберите: `npm run build`
   - Загрузите папку `dist/` на хостинг (Apache/Nginx)

2. **Backend** (Node.js сервер):
   - Загрузите папку `server/` на сервер
   - Установите зависимости: `cd server && npm install`
   - Настройте переменные окружения
   - Запустите через PM2 или systemd

**Пример с PM2:**
```bash
cd server
npm install --production
pm2 start index.js --name elena-booking-api
pm2 save
```

### Вариант 2: Render.com (Full Stack)

Создайте два сервиса в Render:

**1. Web Service (Frontend):**
- Type: Static Site
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

**2. Web Service (Backend):**
- Type: Web Service
- Build Command: `cd server && npm install`
- Start Command: `node index.js`
- Environment Variables:
  - `PORT` (автоматически)
  - `NODE_ENV=production`

### Вариант 3: VPS с Nginx

**Nginx конфигурация для frontend:**
```nginx
server {
    listen 80;
    server_name elena-manicure.ru;
    root /var/www/elena-manicure/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Systemd service для backend:**
```ini
[Unit]
Description=Elena Booking API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/elena-manicure/server
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

## Переменные окружения

### Frontend (.env)
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
VITE_API_URL=https://api.elena-manicure.ru/api
```

### Backend (server/.env или системные)
```env
PORT=3001
NODE_ENV=production
```

## Безопасность

✅ **Реализовано:**
- CORS настроен для работы с frontend
- Валидация входных данных
- Проверка на дублирование записей
- Автоматическая очистка старых записей (старше 3 месяцев)

⚠️ **Рекомендуется добавить:**
- Аутентификацию для DELETE запросов (API ключ)
- Rate limiting
- HTTPS
- Логирование запросов

## Мониторинг

Проверка здоровья сервера:
```bash
curl http://localhost:3001/api/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

## Резервное копирование

Файл с записями: `server/data/bookedSlots.json`

Рекомендуется настроить автоматическое резервное копирование:
```bash
# Пример cron задачи (каждый день в 3:00)
0 3 * * * cp /var/www/elena-manicure/server/data/bookedSlots.json /backup/bookedSlots-$(date +\%Y\%m\%d).json
```

## Обновление

1. Остановите сервер: `pm2 stop elena-booking-api`
2. Обновите код
3. Установите зависимости: `cd server && npm install`
4. Запустите: `pm2 start elena-booking-api`

---

**Готово!** Система автоматического управления записями готова к работе 🎉

