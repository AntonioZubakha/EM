# Настройка переменных окружения

## 1. Создайте файл `.env` в корне проекта:

```env
# Frontend переменные окружения
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
VITE_API_URL=http://localhost:3001/api

# Админ-панель
VITE_ADMIN_LOGIN=ElenaK
VITE_ADMIN_PASSWORD=your_secure_password_here
VITE_ADMIN_TOKEN=your_secure_random_token_here
```

**Пример для продакшена:**
```env
VITE_TELEGRAM_BOT_TOKEN=8598130292:AAFLDD-3ucZmJqkPfXmaLC_rifTBeGMHkHA
VITE_TELEGRAM_CHAT_ID=-1003270227940
VITE_API_URL=https://elena-manicure-api.onrender.com/api
VITE_ADMIN_LOGIN=ElenaK
VITE_ADMIN_PASSWORD=your_secure_password_here
VITE_ADMIN_TOKEN=a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6
```

## 2. Создайте файл `server/.env`:

```env
# Backend переменные окружения
PORT=3001

# Токен для защиты админских API endpoints
# Должен совпадать с VITE_ADMIN_TOKEN в корневом .env
ADMIN_TOKEN=your_secure_random_token_here
```

**Пример:**
```env
ADMIN_TOKEN=a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6
```

## Как сгенерировать токен:

### Вариант 1: Через Node.js (рекомендуется)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Вариант 2: Онлайн генератор
Используйте любой генератор случайных строк, например:
- https://www.random.org/strings/
- Генерируйте строку длиной 64 символа (буквы и цифры)

### Вариант 3: Просто придумайте
Можно использовать любую случайную строку, например:
```
VITE_ADMIN_TOKEN=a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6
```

## Важно:

- **VITE_ADMIN_TOKEN** и **ADMIN_TOKEN** должны совпадать!
- Токен должен быть достаточно длинным (минимум 32 символа)
- Используйте случайные символы (буквы, цифры)
- Никогда не коммитьте `.env` файлы в Git (они уже в `.gitignore`)
- Не используйте простые слова или даты рождения

