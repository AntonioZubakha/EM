// Backend сервер для управления записями
// Адаптирован для работы с Deta Cloud вместо файловой системы
const express = require('express');
const cors = require('cors');
const {
  loadBookedSlots,
  saveBookedSlot,
  saveBookedSlots,
  deleteBookedSlot,
  loadWorkingDays,
  saveWorkingDay,
  deleteWorkingDay,
  lockSlot,
  unlockSlot,
  cleanupExpiredLocks
} = require('./dbStorage');

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка CORS для GitHub Pages и кастомного домена
const corsOptions = {
  origin: [
    'https://elena-manicure.ru',
    'https://www.elena-manicure.ru',
    'https://antoniozubakha.github.io', // для тестирования GitHub Pages
    'http://localhost:3050', // для локальной разработки
    'http://localhost:5173' // для Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Периодическая очистка устаревших lock'ов (каждые 5 минут)
setInterval(() => {
  try {
    cleanupExpiredLocks();
  } catch (err) {
    console.error('Ошибка очистки lock\'ов', err);
  }
}, 5 * 60 * 1000);

// Фильтровать старые записи (старше 3 месяцев)
function filterOldSlots(slots) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  return slots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= threeMonthsAgo;
  });
}

// API Routes

// GET /api/booked-slots - Получить все занятые слоты
app.get('/api/booked-slots', async (req, res) => {
  try {
    const slots = await loadBookedSlots();
    const validSlots = filterOldSlots(slots);
    
    // Если передан параметр date, фильтруем по дате
    if (req.query.date) {
      const filtered = validSlots.filter(slot => slot.date === req.query.date);
      return res.json({ bookedSlots: filtered });
    }
    
    res.json({ bookedSlots: validSlots });
  } catch (error) {
    console.error('Ошибка при получении слотов:', error);
    res.status(500).json({ error: 'Ошибка при получении занятых слотов' });
  }
});

// GET /api/booked-slots/:date - Получить занятые слоты на конкретную дату
app.get('/api/booked-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const slots = await loadBookedSlots();
    const validSlots = filterOldSlots(slots);
    const slotsForDate = validSlots
      .filter(slot => slot.date === date)
      .map(slot => slot.time);
    res.json({ times: slotsForDate });
  } catch (error) {
    console.error('Ошибка при получении слотов для даты:', error);
    res.status(500).json({ error: 'Ошибка при получении занятых слотов' });
  }
});

// Функция для вычисления следующих слотов времени
function getNextTimeSlots(startTime, durationMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  
  // Количество получасовых слотов (округление вверх)
  const numberOfSlots = Math.ceil(durationMinutes / 30);
  
  // Начальное время в минутах от начала дня
  let currentMinutes = startHour * 60 + startMinute;
  
  for (let i = 0; i < numberOfSlots; i++) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    // Максимальное время 20:00 (последний слот)
    if (hour > 20 || (hour === 20 && minute > 0)) break;
    
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push(timeStr);
    
    // Переходим к следующему получасовому слоту
    currentMinutes += 30;
  }
  
  return slots;
}

// POST /api/booked-slots - Добавить новую запись
app.post('/api/booked-slots', async (req, res) => {
  const slotsToBook = [];
  const locksToUnlock = [];
  
  try {
    const { date, time, name, phone, service, durationMinutes } = req.body;
    
    // Валидация
    if (!date || !time) {
      return res.status(400).json({ error: 'Дата и время обязательны' });
    }
    
    // Проверка формата даты (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
    }
    
    // Проверка валидности даты
    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== date) {
      return res.status(400).json({ error: 'Невалидная дата' });
    }
    
    // Проверка, что дата не в прошлом
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return res.status(400).json({ error: 'Нельзя бронировать на прошедшую дату' });
    }
    
    // Проверка формата времени (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Неверный формат времени. Используйте HH:MM' });
    }
    
    // Проверка валидности времени
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: 'Невалидное время' });
    }
    
    // Простая валидация длины полей
    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Имя слишком длинное' });
    }
    if (phone && phone.length > 20) {
      return res.status(400).json({ error: 'Телефон слишком длинный' });
    }
    if (service && service.length > 200) {
      return res.status(400).json({ error: 'Название услуги слишком длинное' });
    }
    
    // Проверка: процедура не должна заканчиваться после 21:00
    const duration = durationMinutes || 30;
    const [startHour, startMinute] = time.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    
    // Проверяем, не выходит ли конец процедуры за 21:00
    if (endHour > 21 || (endHour === 21 && endMinute > 0)) {
      return res.status(400).json({ error: 'Выбранные процедуры не поместятся в рабочее время, так как закончатся после 21:00. Пожалуйста, выберите более ранний временной слот' });
    }
    
    // Вычисляем слоты (каждый слот = 30 минут)
    const slotsToBookArray = getNextTimeSlots(time, duration);
    
    // Блокируем все необходимые слоты перед проверкой
    for (const slotTime of slotsToBookArray) {
      const locked = await lockSlot(date, slotTime);
      if (!locked) {
        // Если не удалось заблокировать, разблокируем уже заблокированные
        for (const unlockSlotTime of locksToUnlock) {
          await unlockSlot(date, unlockSlotTime);
        }
        return res.status(409).json({ error: `Время ${slotTime} уже занято или обрабатывается другим запросом` });
      }
      locksToUnlock.push(slotTime);
      slotsToBook.push(slotTime);
    }
    
    // Загружаем текущие слоты
    const slots = await loadBookedSlots();
    
    // Проверяем, не заняты ли все необходимые слоты
    for (const slotTime of slotsToBook) {
      const isBooked = slots.some(slot => slot.date === date && slot.time === slotTime);
      if (isBooked) {
        // Разблокируем все слоты перед возвратом ошибки
        for (const unlockSlotTime of locksToUnlock) {
          await unlockSlot(date, unlockSlotTime);
        }
        return res.status(409).json({ error: `Время ${slotTime} уже занято` });
      }
    }
    
    // Сохраняем все необходимые слоты (каждый отдельно)
    const bookedSlots = [];
    let allSaved = true;
    
    for (const slotTime of slotsToBook) {
      const newSlot = {
        date,
        time: slotTime,
        name: name || undefined,
        phone: phone || undefined,
        service: service || undefined,
        bookedAt: new Date().toISOString(),
      };
      
      const saved = await saveBookedSlot(newSlot);
      if (!saved) {
        allSaved = false;
        break;
      }
      bookedSlots.push(newSlot);
    }
    
    // Разблокируем все слоты после сохранения
    for (const unlockSlotTime of locksToUnlock) {
      await unlockSlot(date, unlockSlotTime);
    }
    
    if (!allSaved) {
      // Если не удалось сохранить, проверяем еще раз
      const slotsAfter = await loadBookedSlots();
      for (const slotTime of slotsToBook) {
        const isBookedAfter = slotsAfter.some(slot => slot.date === date && slot.time === slotTime);
        if (isBookedAfter) {
          return res.status(409).json({ error: `Время ${slotTime} уже занято` });
        }
      }
      return res.status(500).json({ error: 'Ошибка при сохранении записи' });
    }
    
    res.status(201).json({ success: true, slots: bookedSlots });
  } catch (error) {
    // Разблокируем все слоты в случае ошибки
    for (const unlockSlotTime of locksToUnlock) {
      await unlockSlot(req.body.date, unlockSlotTime).catch(console.error);
    }
    console.error('Ошибка при добавлении записи:', error);
    res.status(500).json({ error: 'Ошибка при добавлении записи' });
  }
});

// Простая проверка токена для админских операций
const checkAdminToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (!expectedToken) {
    return res.status(500).json({ error: 'Админ-панель не настроена' });
  }
  
  if (token === expectedToken) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// DELETE /api/booked-slots/:date/:time - Удалить запись (только для админа)
app.delete('/api/booked-slots/:date/:time', checkAdminToken, async (req, res) => {
  try {
    const { date, time } = req.params;
    
    // Проверяем, существует ли запись
    const slots = await loadBookedSlots();
    const exists = slots.some(slot => slot.date === date && slot.time === time);
    
    if (!exists) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    // Удаляем слот из Deta Base
    const deleted = await deleteBookedSlot(date, time);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Ошибка при удалении записи' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).json({ error: 'Ошибка при удалении записи' });
  }
});

// API для управления рабочими днями

// GET /api/working-days - Получить все переопределения рабочих дней
app.get('/api/working-days', async (req, res) => {
  try {
    const overrides = await loadWorkingDays();
    res.json({ overrides });
  } catch (error) {
    console.error('Ошибка при получении рабочих дней:', error);
    res.status(500).json({ error: 'Ошибка при получении рабочих дней' });
  }
});

// POST /api/working-days/:date - Установить статус дня (working/off) (только для админа)
app.post('/api/working-days/:date', checkAdminToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { status } = req.body; // 'working' или 'off'
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
    }
    
    if (status !== 'working' && status !== 'off') {
      return res.status(400).json({ error: 'Статус должен быть "working" или "off"' });
    }
    
    // Сохраняем день отдельно в Deta Base
    const saved = await saveWorkingDay(date, status);
    if (!saved) {
      return res.status(500).json({ error: 'Ошибка при сохранении статуса дня' });
    }
    
    res.json({ success: true, date, status });
  } catch (error) {
    console.error('Ошибка при установке статуса дня:', error);
    res.status(500).json({ error: 'Ошибка при установке статуса дня' });
  }
});

// DELETE /api/working-days/:date - Удалить переопределение (вернуть к автоматическому) (только для админа)
app.delete('/api/working-days/:date', checkAdminToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Удаляем день из Deta Base
    const deleted = await deleteWorkingDay(date);
    if (!deleted) {
      return res.status(500).json({ error: 'Ошибка при удалении переопределения' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении переопределения:', error);
    res.status(500).json({ error: 'Ошибка при удалении переопределения' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Инициализация при запуске
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📅 API для управления записями доступен на http://localhost:${PORT}/api`);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    console.log(`☁️  Используется Supabase для хранения данных`);
  } else {
    console.warn(`⚠️  SUPABASE_URL или SUPABASE_KEY не установлены, сохранение работать не будет`);
  }
});

