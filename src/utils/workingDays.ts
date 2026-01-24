// Утилита для работы с рабочими днями
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Базовая функция определения рабочих дней (та же логика, что в Booking)
export const isWorkingDayBase = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (0 = январь, 11 = декабрь)
  const day = date.getDate();
  
  // Декабрь: рабочие дни 3-4, 7-8, 11-12, 15-16, 19-20, 23-24, 27-28 (31 не рабочий)
  if (month === 11) { // декабрь = 11
    const decemberWorkingDays = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 27, 28];
    return decemberWorkingDays.includes(day);
  }
  
  // Январь: новогодние каникулы 1-8 (не рабочие), затем рабочие дни 9, 12-13, 16-17, 20-21, 24-25, 28-29...
  if (month === 0) { // январь = 0
    // Новогодние каникулы: 1-8 января - не рабочие дни (для любого года)
    if (day >= 1 && day <= 8) {
      return false;
    }
    
    // 9 января - первый рабочий день после каникул
    if (day === 9) {
      return true;
    }
    
    // Паттерн: пары дней начиная с 12-13, затем каждые 4 дня новая пара
    // 12-13, 16-17, 20-21, 24-25, 28-29
    if (day >= 12) {
      const daysFrom12 = day - 12;
      const cycleDay = daysFrom12 % 4;
      // В паре: 0 и 1 день цикла (12-13, 16-17, 20-21, 24-25, 28-29...)
      return cycleDay === 0 || cycleDay === 1;
    }
    
    return false;
  }
  
  // Для остальных месяцев применяем паттерн: 2 рабочих дня, 2 выходных (цикл 4 дня)
  // Начинаем с 1 февраля (после последнего рабочего дня января - 29)
  if (month >= 1) {
    // Используем последний рабочий день января (29) текущего года как точку отсчета
    const lastJanWorkDay = new Date(year, 0, 29); // 29 января текущего года
    const daysDiff = Math.round((date.getTime() - lastJanWorkDay.getTime()) / (1000 * 60 * 60 * 24));
    
    // 30, 31 января - выходные (день 1, 2)
    // 1, 2 февраля - рабочие (день 3, 4)
    // 3, 4 февраля - выходные (день 5, 6)
    // 5, 6 февраля - рабочие (день 7, 8)
    // и так далее по циклу 4 дня
    if (daysDiff >= 1) {
      const adjustedDays = daysDiff - 1; // Начинаем отсчет с 30 января (день 1)
      const cycleDay = adjustedDays % 4;
      // Дни 2 и 3 цикла (1 и 2 февраля) - рабочие
      return cycleDay === 2 || cycleDay === 3;
    }
    return false;
  }
  
  return false;
};

// Кэш для переопределений
let workingDaysOverrides: Record<string, 'working' | 'off'> = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 минута

// Загрузить переопределения с сервера
export const loadWorkingDaysOverrides = async (): Promise<Record<string, 'working' | 'off'>> => {
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION) {
    try {
      const response = await fetch(`${API_BASE_URL}/working-days`);
      if (response.ok) {
        const data = await response.json();
        workingDaysOverrides = data.overrides || {};
        lastFetchTime = now;
      }
    } catch (error) {
      console.error('Ошибка при загрузке переопределений рабочих дней:', error);
    }
  }
  return workingDaysOverrides;
};

// Проверить, рабочий ли день (с учетом переопределений)
export const isWorkingDay = async (date: Date): Promise<boolean> => {
  await loadWorkingDaysOverrides();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Если есть переопределение, используем его
  if (workingDaysOverrides[dateStr]) {
    return workingDaysOverrides[dateStr] === 'working';
  }
  
  // Иначе используем базовую логику
  return isWorkingDayBase(date);
};

// Установить статус дня
export const setDayStatus = async (date: Date, status: 'working' | 'off'): Promise<boolean> => {
  try {
    const dateStr = format(date, 'yyyy-MM-dd');
    const adminToken = import.meta.env.VITE_ADMIN_TOKEN;
    console.log('setDayStatus: отправка запроса', { dateStr, status, API_BASE_URL });
    
    const response = await fetch(`${API_BASE_URL}/working-days/${dateStr}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken || '',
      },
      body: JSON.stringify({ status }),
    });
    
    console.log('setDayStatus: ответ сервера', { status: response.status, ok: response.ok });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('setDayStatus: ошибка ответа', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('setDayStatus: результат', result);
    
    // Обновляем кэш
    workingDaysOverrides[dateStr] = status;
    lastFetchTime = 0; // Сбрасываем кэш для перезагрузки
    
    return true;
  } catch (error) {
    console.error('Ошибка при установке статуса дня:', error);
    return false;
  }
};

// Удалить переопределение (вернуть к автоматическому)
export const removeDayOverride = async (date: Date): Promise<boolean> => {
  try {
    const dateStr = format(date, 'yyyy-MM-dd');
    const adminToken = import.meta.env.VITE_ADMIN_TOKEN;
    const response = await fetch(`${API_BASE_URL}/working-days/${dateStr}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': adminToken || '',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    // Обновляем кэш
    delete workingDaysOverrides[dateStr];
    lastFetchTime = 0; // Сбрасываем кэш для перезагрузки
    
    return true;
  } catch (error) {
    console.error('Ошибка при удалении переопределения:', error);
    return false;
  }
};

// Синхронная версия для использования в компонентах (использует кэш)
export const isWorkingDaySync = (date: Date): boolean => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Если есть переопределение, используем его
  if (workingDaysOverrides[dateStr]) {
    return workingDaysOverrides[dateStr] === 'working';
  }
  
  // Иначе используем базовую логику
  return isWorkingDayBase(date);
};

