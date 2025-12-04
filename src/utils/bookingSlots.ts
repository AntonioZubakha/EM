// Утилита для управления занятыми временными слотами
// Данные хранятся на сервере через API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface BookedSlot {
  date: string; // Формат: YYYY-MM-DD
  time: string; // Формат: HH:MM
  name?: string; // Имя клиента (опционально, для админа)
  phone?: string; // Телефон клиента (опционально, для админа)
  service?: string; // Услуга (опционально)
  bookedAt: string; // Время создания записи (ISO string)
}

/**
 * Получить все занятые слоты с сервера
 */
export const getBookedSlots = async (): Promise<BookedSlot[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/booked-slots`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.bookedSlots || [];
  } catch (error) {
    console.error('Ошибка при получении занятых слотов с сервера:', error);
    // Возвращаем пустой массив при ошибке
    return [];
  }
};

// Кэш для занятых слотов (обновляется при загрузке)
let cachedSlots: BookedSlot[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 секунд

/**
 * Обновить кэш занятых слотов
 */
const refreshCache = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION) {
    cachedSlots = await getBookedSlots();
    lastFetchTime = now;
  }
};

/**
 * Проверить, занят ли слот
 */
export const isSlotBooked = async (date: Date, time: string): Promise<boolean> => {
  await refreshCache();
  const dateStr = formatDate(date);
  
  return cachedSlots.some(slot => slot.date === dateStr && slot.time === time);
};

/**
 * Забронировать слот на сервере
 */
export const bookSlot = async (
  date: Date, 
  time: string, 
  name?: string, 
  phone?: string, 
  service?: string
): Promise<boolean> => {
  try {
    const dateStr = formatDate(date);
    
    // Проверяем, не занят ли уже слот
    const alreadyBooked = await isSlotBooked(date, time);
    if (alreadyBooked) {
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/booked-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: dateStr,
        time,
        name,
        phone,
        service,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Ошибка при бронировании слота:', error);
      return false;
    }
    
    // Обновляем кэш
    await refreshCache();
    
    return true;
  } catch (error) {
    console.error('Ошибка при бронировании слота:', error);
    return false;
  }
};

/**
 * Освободить слот (для админа)
 */
export const releaseSlot = async (date: Date, time: string): Promise<boolean> => {
  try {
    const dateStr = formatDate(date);
    
    const response = await fetch(`${API_BASE_URL}/booked-slots/${dateStr}/${time}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Ошибка при освобождении слота:', error);
      return false;
    }
    
    // Обновляем кэш
    await refreshCache();
    
    return true;
  } catch (error) {
    console.error('Ошибка при освобождении слота:', error);
    return false;
  }
};

/**
 * Получить все занятые слоты на конкретную дату
 */
export const getBookedSlotsForDate = async (date: Date): Promise<string[]> => {
  try {
    const dateStr = formatDate(date);
    const response = await fetch(`${API_BASE_URL}/booked-slots/${dateStr}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.times || [];
  } catch (error) {
    console.error('Ошибка при получении слотов для даты:', error);
    // Fallback: используем кэш
    await refreshCache();
    const dateStr = formatDate(date);
    return cachedSlots
      .filter(slot => slot.date === dateStr)
      .map(slot => slot.time);
  }
};

/**
 * Форматировать дату в YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Получить все занятые слоты (для админ-панели в будущем)
 */
export const getAllBookedSlots = async (): Promise<BookedSlot[]> => {
  return await getBookedSlots();
};

