# 🚀 Деплой в продакшен

## Вариант 1: Render.com (простой способ)

### Frontend (Static Site):
1. **New** → **Static Site**
2. Подключите GitHub репозиторий
3. Настройки:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:**
     ```
     VITE_TELEGRAM_BOT_TOKEN=your_bot_token
     VITE_TELEGRAM_CHAT_ID=your_chat_id
     VITE_API_URL=https://your-backend-url.onrender.com/api
     VITE_ADMIN_LOGIN=ElenaK
     VITE_ADMIN_PASSWORD=your_password
     VITE_ADMIN_TOKEN=your_token
     ```
   - **Redirects:** `/* /index.html 200`

### Backend (Web Service):
1. **New** → **Web Service**
2. Подключите тот же репозиторий
3. Настройки:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment Variables:**
     ```
     ADMIN_TOKEN=your_token (должен совпадать с VITE_ADMIN_TOKEN)
     ```
   - **Health Check Path:** `/api/health`

⚠️ **Важно:** Сначала деплойте Backend, получите его URL, затем обновите `VITE_API_URL` во Frontend.

---

## Вариант 2: VPS (для продакшена)

### Frontend:
```bash
npm run build
# Загрузите dist/ на хостинг (Apache/Nginx)
```

### Backend:
```bash
cd server
npm install --production
pm2 start index.js --name elena-api
pm2 save
```

### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name elena-manicure.ru;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

---

## Переменные окружения

**На клиенте (Render Static Site или .env):**
- Все переменные с префиксом `VITE_*`

**На сервере (Render Web Service или server/.env):**
- `ADMIN_TOKEN` (должен совпадать с `VITE_ADMIN_TOKEN`)

---

## Проверка после деплоя

1. Frontend открывается
2. Форма записи работает
3. API отвечает: `https://your-api-url/api/health`
4. Админ-панель работает (проверьте удаление записи)
