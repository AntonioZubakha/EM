// Пример модуля для работы с Deta Base
// Это пример, который нужно будет адаптировать под ваш проект

const { Deta } = require('deta');

// Инициализация Deta (берет ключ из переменной окружения DETA_PROJECT_KEY)
const deta = Deta(process.env.DETA_PROJECT_KEY);

// Создаем базы данных
const bookedSlotsBase = deta.Base('bookedSlots');
const workingDaysBase = deta.Base('workingDays');

/**
 * Загрузить все забронированные слоты
 * @returns {Promise<Array>} Массив слотов
 */
async function loadBookedSlots() {
  try {
    const result = await bookedSlotsBase.fetch();
    // Deta Base возвращает объект с items
    // Преобразуем в массив слотов
    const slots = result.items || [];
    
    // Если нужно сохранить старую структуру { bookedSlots: [...] }
    return slots.map(item => ({
      date: item.date,
      time: item.time,
      name: item.name,
      phone: item.phone,
      service: item.service,
      bookedAt: item.bookedAt
    }));
  } catch (error) {
    console.error('Ошибка при загрузке слотов из Deta:', error);
    return [];
  }
}

/**
 * Сохранить забронированный слот
 * @param {Object} slot - Объект слота
 */
async function saveBookedSlot(slot) {
  try {
    const key = `${slot.date}_${slot.time}`; // Уникальный ключ
    await bookedSlotsBase.put({
      key,
      ...slot
    });
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении слота в Deta:', error);
    return false;
  }
}

/**
 * Удалить забронированный слот
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {string} time - Время в формате HH:MM
 */
async function deleteBookedSlot(date, time) {
  try {
    const key = `${date}_${time}`;
    await bookedSlotsBase.delete(key);
    return true;
  } catch (error) {
    console.error('Ошибка при удалении слота из Deta:', error);
    return false;
  }
}

/**
 * Получить все слоты для конкретной даты
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @returns {Promise<Array>} Массив слотов для даты
 */
async function getBookedSlotsForDate(date) {
  try {
    const result = await bookedSlotsBase.fetch({ date });
    return result.items || [];
  } catch (error) {
    console.error('Ошибка при получении слотов для даты из Deta:', error);
    return [];
  }
}

/**
 * Загрузить переопределения рабочих дней
 * @returns {Promise<Object>} Объект с переопределениями { 'YYYY-MM-DD': 'working' | 'off' }
 */
async function loadWorkingDays() {
  try {
    const result = await workingDaysBase.fetch();
    const overrides = {};
    
    (result.items || []).forEach(item => {
      overrides[item.key] = item.status; // key = дата, status = 'working' или 'off'
    });
    
    return overrides;
  } catch (error) {
    console.error('Ошибка при загрузке рабочих дней из Deta:', error);
    return {};
  }
}

/**
 * Сохранить переопределение рабочего дня
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {string} status - 'working' или 'off'
 */
async function saveWorkingDay(date, status) {
  try {
    await workingDaysBase.put({
      key: date,
      status
    });
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении рабочего дня в Deta:', error);
    return false;
  }
}

/**
 * Удалить переопределение рабочего дня
 * @param {string} date - Дата в формате YYYY-MM-DD
 */
async function deleteWorkingDay(date) {
  try {
    await workingDaysBase.delete(date);
    return true;
  } catch (error) {
    console.error('Ошибка при удалении рабочего дня из Deta:', error);
    return false;
  }
}

module.exports = {
  loadBookedSlots,
  saveBookedSlot,
  deleteBookedSlot,
  getBookedSlotsForDate,
  loadWorkingDays,
  saveWorkingDay,
  deleteWorkingDay
};

