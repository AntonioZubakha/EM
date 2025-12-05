// Backend сервер для управления записями
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
// Путь к файлу данных (работает и локально, и на Render)
const BOOKED_SLOTS_FILE = path.join(__dirname, 'data', 'bookedSlots.json');
const WORKING_DAYS_FILE = path.join(__dirname, 'data', 'workingDays.json');

// Middleware
app.use(cors());
app.use(express.json());

// Создаем папку data если её нет
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

// Инициализация файла с записями если его нет
async function ensureBookedSlotsFile() {
  try {
    await fs.access(BOOKED_SLOTS_FILE);
  } catch {
    // Файл не существует, создаем пустой
    await fs.writeFile(BOOKED_SLOTS_FILE, JSON.stringify({ bookedSlots: [] }, null, 2));
  }
}

// Инициализация файла с рабочими днями если его нет
async function ensureWorkingDaysFile() {
  try {
    await fs.access(WORKING_DAYS_FILE);
  } catch {
    // Файл не существует, создаем пустой
    await fs.writeFile(WORKING_DAYS_FILE, JSON.stringify({ overrides: {} }, null, 2));
  }
}

// Загрузить настройки рабочих дней
async function loadWorkingDays() {
  try {
    const data = await fs.readFile(WORKING_DAYS_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.overrides || {};
  } catch (error) {
    console.error('Ошибка при чтении файла рабочих дней:', error);
    return {};
  }
}

// Сохранить настройки рабочих дней
async function saveWorkingDays(overrides) {
  try {
    await fs.writeFile(WORKING_DAYS_FILE, JSON.stringify({ overrides }, null, 2));
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении файла рабочих дней:', error);
    return false;
  }
}

// Загрузить все занятые слоты
async function loadBookedSlots() {
  try {
    const data = await fs.readFile(BOOKED_SLOTS_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.bookedSlots || [];
  } catch (error) {
    console.error('Ошибка при чтении файла:', error);
    return [];
  }
}

// Сохранить занятые слоты
async function saveBookedSlots(slots) {
  try {
    await fs.writeFile(BOOKED_SLOTS_FILE, JSON.stringify({ bookedSlots: slots }, null, 2));
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error);
    return false;
  }
}

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

// POST /api/booked-slots - Добавить новую запись
app.post('/api/booked-slots', async (req, res) => {
  try {
    const { date, time, name, phone, service } = req.body;
    
    // Валидация
    if (!date || !time) {
      return res.status(400).json({ error: 'Дата и время обязательны' });
    }
    
    // Проверка формата даты (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
    }
    
    // Проверка формата времени (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Неверный формат времени. Используйте HH:MM' });
    }
    
    const slots = await loadBookedSlots();
    
    // Проверяем, не занят ли уже слот
    const isBooked = slots.some(slot => slot.date === date && slot.time === time);
    if (isBooked) {
      return res.status(409).json({ error: 'Это время уже занято' });
    }
    
    // Добавляем новую запись
    const newSlot = {
      date,
      time,
      name: name || undefined,
      phone: phone || undefined,
      service: service || undefined,
      bookedAt: new Date().toISOString(),
    };
    
    slots.push(newSlot);
    const saved = await saveBookedSlots(slots);
    
    if (!saved) {
      return res.status(500).json({ error: 'Ошибка при сохранении записи' });
    }
    
    res.status(201).json({ success: true, slot: newSlot });
  } catch (error) {
    console.error('Ошибка при добавлении записи:', error);
    res.status(500).json({ error: 'Ошибка при добавлении записи' });
  }
});

// DELETE /api/booked-slots/:date/:time - Удалить запись
app.delete('/api/booked-slots/:date/:time', async (req, res) => {
  try {
    const { date, time } = req.params;
    
    const slots = await loadBookedSlots();
    const initialLength = slots.length;
    
    const filteredSlots = slots.filter(
      slot => !(slot.date === date && slot.time === time)
    );
    
    if (filteredSlots.length === initialLength) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    const saved = await saveBookedSlots(filteredSlots);
    
    if (!saved) {
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

// POST /api/working-days/:date - Установить статус дня (working/off)
app.post('/api/working-days/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { status } = req.body; // 'working' или 'off'
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
    }
    
    if (status !== 'working' && status !== 'off') {
      return res.status(400).json({ error: 'Статус должен быть "working" или "off"' });
    }
    
    const overrides = await loadWorkingDays();
    overrides[date] = status;
    
    const saved = await saveWorkingDays(overrides);
    if (!saved) {
      return res.status(500).json({ error: 'Ошибка при сохранении статуса дня' });
    }
    
    res.json({ success: true, date, status });
  } catch (error) {
    console.error('Ошибка при установке статуса дня:', error);
    res.status(500).json({ error: 'Ошибка при установке статуса дня' });
  }
});

// DELETE /api/working-days/:date - Удалить переопределение (вернуть к автоматическому)
app.delete('/api/working-days/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const overrides = await loadWorkingDays();
    delete overrides[date];
    
    const saved = await saveWorkingDays(overrides);
    if (!saved) {
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
Promise.all([ensureBookedSlotsFile(), ensureWorkingDaysFile()]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📅 API для управления записями доступен на http://localhost:${PORT}/api`);
  });
}).catch(console.error);

