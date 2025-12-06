// Модуль работы с Supabase (PostgreSQL)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// In-memory lock для защиты от двойных бронирований (достаточно для одного инстанса Render)
const LOCK_TTL = 30_000;
const locks = new Map(); // key -> expiresAt

function isSupabaseReady() {
  if (!supabase) {
    console.warn('Supabase не сконфигурирован: установите SUPABASE_URL и SUPABASE_KEY');
    return false;
  }
  return true;
}

async function loadBookedSlots() {
  if (!isSupabaseReady()) return [];
  try {
    const PAGE_SIZE = 1000;
    let from = 0;
    let to = PAGE_SIZE - 1;
    const allSlots = [];

    while (true) {
      const { data, error } = await supabase
        .from('booked_slots')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .range(from, to);

      if (error) throw error;
      allSlots.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
      to += PAGE_SIZE;
    }

    // приводим к ожидаемому формату
    return allSlots.map(({ booked_at, ...slot }) => ({
      ...slot,
      bookedAt: booked_at || slot.bookedAt
    }));
  } catch (error) {
    console.error('Ошибка при загрузке слотов из Supabase:', error);
    return [];
  }
}

async function saveBookedSlot(slot) {
  if (!isSupabaseReady()) return false;
  try {
    const payload = {
      date: slot.date,
      time: slot.time,
      name: slot.name || null,
      phone: slot.phone || null,
      service: slot.service || null,
      booked_at: slot.bookedAt || new Date().toISOString()
    };

    const { error } = await supabase.from('booked_slots').insert(payload);
    if (error) {
      // 23505 — уникальное ограничение (дубликат слота)
      if (error.code === '23505') return false;
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении слота в Supabase:', error);
    return false;
  }
}

async function saveBookedSlots(slots) {
  if (!isSupabaseReady()) return false;
  for (const slot of slots) {
    const ok = await saveBookedSlot(slot);
    if (!ok) return false;
  }
  return true;
}

async function deleteBookedSlot(date, time) {
  if (!isSupabaseReady()) return false;
  try {
    const { error } = await supabase
      .from('booked_slots')
      .delete()
      .eq('date', date)
      .eq('time', time);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ошибка при удалении слота из Supabase:', error);
    return false;
  }
}

async function getBookedSlotsForDate(date) {
  if (!isSupabaseReady()) return [];
  try {
    const { data, error } = await supabase
      .from('booked_slots')
      .select('*')
      .eq('date', date);
    if (error) throw error;
    return (data || []).map(({ booked_at, ...slot }) => ({
      ...slot,
      bookedAt: booked_at || slot.bookedAt
    }));
  } catch (error) {
    console.error('Ошибка при получении слотов для даты из Supabase:', error);
    return [];
  }
}

async function loadWorkingDays() {
  if (!isSupabaseReady()) return {};
  try {
    const { data, error } = await supabase
      .from('working_days')
      .select('date, status');
    if (error) throw error;
    const overrides = {};
    (data || []).forEach(row => {
      overrides[row.date] = row.status;
    });
    return overrides;
  } catch (error) {
    console.error('Ошибка при загрузке рабочих дней из Supabase:', error);
    return {};
  }
}

async function saveWorkingDay(date, status) {
  if (!isSupabaseReady()) return false;
  try {
    const { error } = await supabase
      .from('working_days')
      .upsert({ date, status });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении рабочего дня в Supabase:', error);
    return false;
  }
}

async function deleteWorkingDay(date) {
  if (!isSupabaseReady()) return false;
  try {
    const { error } = await supabase
      .from('working_days')
      .delete()
      .eq('date', date);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ошибка при удалении рабочего дня из Supabase:', error);
    return false;
  }
}

function lockSlot(date, time) {
  const key = `${date}_${time}`;
  const now = Date.now();
  const existing = locks.get(key);
  if (existing && existing > now) return false;
  locks.set(key, now + LOCK_TTL);
  return true;
}

function unlockSlot(date, time) {
  const key = `${date}_${time}`;
  locks.delete(key);
}

function cleanupExpiredLocks() {
  const now = Date.now();
  for (const [key, expiresAt] of locks.entries()) {
    if (expiresAt < now) locks.delete(key);
  }
}

module.exports = {
  loadBookedSlots,
  saveBookedSlot,
  saveBookedSlots,
  deleteBookedSlot,
  getBookedSlotsForDate,
  loadWorkingDays,
  saveWorkingDay,
  deleteWorkingDay,
  lockSlot,
  unlockSlot,
  cleanupExpiredLocks
};

