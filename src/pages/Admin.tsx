import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getBookedSlotsForDate, releaseSlot } from '../utils/bookingSlots';
import { isWorkingDayBase, setDayStatus, loadWorkingDaysOverrides } from '../utils/workingDays';
import pricelistData from '../data/pricelist.json';
import './Admin.scss';

const ADMIN_LOGIN = import.meta.env.VITE_ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const AUTH_PERSIST_KEY = 'admin_auth_persist';
const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

type SlotFormData = {
  time: string;
  name: string;
  services: string[];
  note: string;
};

const parseDurationToMinutes = (duration: string): number => {
  let totalMinutes = 0;
  const hoursMatch = duration.match(/(\d+)\s*ч/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  const minutesMatch = duration.match(/(\d+)\s*мин/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  return totalMinutes;
};

const calculateTotalDuration = (selectedServices: string[]): number => {
  if (selectedServices.length === 0) return 0;
  let totalMinutes = 0;
  selectedServices.forEach(serviceName => {
    const manicureService = pricelistData.manicure.find(s => s.name === serviceName);
    if (manicureService) {
      totalMinutes += parseDurationToMinutes(manicureService.duration);
    } else {
      const pedicureService = pricelistData.pedicure.find(s => s.name === serviceName);
      if (pedicureService) {
        totalMinutes += parseDurationToMinutes(pedicureService.duration);
      }
    }
  });
  return totalMinutes;
};

const getNextTimeSlots = (startTime: string, durationMinutes: number): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const numberOfSlots = Math.ceil(durationMinutes / 30);
  let currentMinutes = startHour * 60 + startMinute;
  for (let i = 0; i < numberOfSlots; i++) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    if (hour > 20 || (hour === 20 && minute > 0)) break;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += 30;
  }
  return slots;
};

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<Record<string, { name?: string; service?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [workingDaysOverrides, setWorkingDaysOverrides] = useState<Record<string, 'working' | 'off'>>({});
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotFormData, setSlotFormData] = useState<SlotFormData>({ time: '', name: '', services: [], note: '' });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Генерируем получасовые слоты с 09:00 до 20:00 (последний слот 20:00)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 20) { // 20:30 не добавляем, последний слот 20:00
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  // Генерируем список всех процедур из прайс-листа
  const allServices = useMemo(() => {
    const serviceList: string[] = [];
    
    // Добавляем все услуги из категории "manicure"
    pricelistData.manicure.forEach((service: { name: string }) => {
      serviceList.push(service.name);
    });
    
    // Добавляем все услуги из категории "pedicure"
    pricelistData.pedicure.forEach((service: { name: string }) => {
      serviceList.push(service.name);
    });
    
    return serviceList;
  }, []);

  // Проверка авторизации при загрузке (с учётом "запомнить на неделю")
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      return;
    }

    try {
      const persisted = localStorage.getItem(AUTH_PERSIST_KEY);
      if (persisted) {
        const parsed = JSON.parse(persisted) as { value: string; expires: number };
        if (parsed.value === 'true' && parsed.expires > Date.now()) {
          setIsAuthenticated(true);
          sessionStorage.setItem('admin_auth', 'true'); // обновляем сессию
        } else if (parsed.expires <= Date.now()) {
          localStorage.removeItem(AUTH_PERSIST_KEY);
        }
      }
    } catch {
      // игнорируем ошибки чтения/парсинга
    }
  }, []);

  // Загрузка переопределений рабочих дней
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkingDaysOverrides().then(overrides => {
        setWorkingDaysOverrides(overrides);
      });
    }
  }, [isAuthenticated, currentMonth]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!ADMIN_PASSWORD) {
      setError('Админ-панель не настроена. Обратитесь к администратору.');
      return;
    }
    
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify({
        value: 'true',
        expires: Date.now() + AUTH_TTL_MS,
      }));
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    localStorage.removeItem(AUTH_PERSIST_KEY);
    setSelectedDate(null);
    setBookedSlots([]);
  };

  interface BookedSlotData {
    date: string;
    time: string;
    name?: string;
    service?: string;
  }

  const loadBookedSlots = useCallback(async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Получаем полную информацию о слотах
      const response = await fetch(`${API_BASE_URL}/booked-slots?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        const slotsForDate = (data.bookedSlots as BookedSlotData[]).filter((slot) => slot.date === dateStr);
        
        const times = slotsForDate.map((slot) => slot.time);
        const info: Record<string, { name?: string; service?: string }> = {};
        
        slotsForDate.forEach((slot) => {
          info[slot.time] = {
            name: slot.name,
            service: slot.service,
          };
        });
        
        setBookedSlots(times);
        setBookedSlotsInfo(info);
      } else {
        // Fallback на старый метод
        const slots = await getBookedSlotsForDate(selectedDate);
        setBookedSlots(slots);
        setBookedSlotsInfo({});
      }
    } catch (error) {
      console.error('Ошибка при загрузке слотов:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Загрузка занятых слотов при выборе даты (только для рабочих дней)
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const hasOverride = dateStr in workingDaysOverrides;
      const baseIsWorking = isWorkingDayBase(selectedDate);
      const isWorking = hasOverride 
        ? workingDaysOverrides[dateStr] === 'working'
        : baseIsWorking;
      
      if (isWorking) {
        loadBookedSlots();
      } else {
        setBookedSlots([]);
        setSelectedDate(null);
      }
    }
  }, [selectedDate, workingDaysOverrides, loadBookedSlots]);

  const handleToggleSlot = async (time: string) => {
    console.log('handleToggleSlot вызвана для времени:', time);
    if (!selectedDate) {
      console.log('Нет выбранной даты');
      return;
    }
    
    if (bookedSlots.includes(time)) {
      // Освобождаем слот с подтверждением
      const slotInfo = bookedSlotsInfo[time];
      const clientInfo = slotInfo?.name ? ` (${slotInfo.name}${slotInfo?.service ? ` - ${slotInfo.service}` : ''})` : '';
      const confirmMessage = `Вы уверены, что хотите освободить слот ${time}${clientInfo}?`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      console.log('Освобождаем слот:', time);
      setLoading(true);
      try {
        const success = await releaseSlot(selectedDate, time);
        if (success) {
          setBookedSlots(prev => prev.filter(slot => slot !== time));
          setBookedSlotsInfo(prev => {
            const updated = { ...prev };
            delete updated[time];
            return updated;
          });
        }
      } catch (error) {
        console.error('Ошибка при освобождении слота:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Показываем форму для ввода данных
      console.log('Показываем форму для слота:', time);
      setSlotFormData({ time, name: '', services: [], note: '' });
      setShowSlotForm(true);
    }
  };

  const handleCloseSlot = async () => {
    if (!selectedDate || !slotFormData.time) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const selectedServices = slotFormData.services.filter(Boolean);
      let servicesText = selectedServices.join(', ');
      if (slotFormData.note) {
        servicesText = servicesText ? `${servicesText} (${slotFormData.note})` : slotFormData.note;
      }
      if (!servicesText) {
        servicesText = 'Закрыто администратором';
      }
      const totalDuration = calculateTotalDuration(selectedServices);
      const durationMinutes = totalDuration > 0 ? totalDuration : 30;
      const slotsToBook = getNextTimeSlots(slotFormData.time, durationMinutes);
      
      const response = await fetch(`${API_BASE_URL}/booked-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          time: slotFormData.time,
          name: slotFormData.name || 'Админ',
          service: servicesText,
          durationMinutes,
        }),
      });
      
      if (response.ok) {
        const updatedSlots = await getBookedSlotsForDate(selectedDate);
        setBookedSlots(updatedSlots);
        setBookedSlotsInfo(prev => {
          const updatedInfo = { ...prev };
          slotsToBook.forEach(slot => {
            updatedInfo[slot] = {
            name: slotFormData.name || 'Админ',
              service: servicesText,
            };
          });
          return updatedInfo;
        });
        setShowSlotForm(false);
        setSlotFormData({ time: '', name: '', services: [], note: '' });
      }
    } catch (error) {
      console.error('Ошибка при закрытии слота:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllSlots = async () => {
    if (!selectedDate || !confirm('Вы уверены, что хотите очистить все слоты на этот день?')) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const adminToken = import.meta.env.VITE_ADMIN_TOKEN;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Удаляем все слоты по одному
      for (const time of bookedSlots) {
        await fetch(`${API_BASE_URL}/booked-slots/${dateStr}/${time}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': adminToken || '',
          },
        });
      }
      
      setBookedSlots([]);
      setBookedSlotsInfo({});
    } catch (error) {
      console.error('Ошибка при очистке слотов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDayStatus = useCallback(async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasOverride = dateStr in workingDaysOverrides;
    const baseIsWorking = isWorkingDayBase(date);
    
    // Определяем текущий статус
    const currentIsWorking = hasOverride 
      ? workingDaysOverrides[dateStr] === 'working'
      : baseIsWorking;
    
    // Переключаем на противоположное
    const newStatus: 'working' | 'off' = currentIsWorking ? 'off' : 'working';
    
    setLoading(true);
    try {
      const success = await setDayStatus(date, newStatus);
      if (success) {
        setWorkingDaysOverrides(prev => ({
          ...prev,
          [dateStr]: newStatus,
        }));
        // Если день стал выходным и был выбран, сбрасываем выбор
        if (newStatus === 'off' && selectedDate && isSameDay(date, selectedDate)) {
          setSelectedDate(null);
          setBookedSlots([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса дня:', error);
    } finally {
      setLoading(false);
    }
  }, [workingDaysOverrides, selectedDate]);

  // Обработчики для long press на мобильных
  const handleTouchStart = useCallback((_e: React.TouchEvent, date: Date) => {
    // Проверяем, что это мобильное устройство (ширина экрана <= 768px)
    if (window.innerWidth > 768) return;
    
    longPressTriggeredRef.current = false;
    setIsLongPressing(false);
    
    const timer = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsLongPressing(true);
      handleToggleDayStatus(date);
    }, 600); // 600ms для long press
    longPressTimerRef.current = timer;
  }, [handleToggleDayStatus]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent, date: Date) => {
    // Проверяем, что это мобильное устройство
    if (window.innerWidth > 768) return;
    
    const wasLongPress = longPressTriggeredRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Если не было long press, делаем обычный клик (выбор дня)
    if (!wasLongPress) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasOverride = dateStr in workingDaysOverrides;
      const baseIsWorking = isWorkingDayBase(date);
      const isWorking = hasOverride 
        ? workingDaysOverrides[dateStr] === 'working'
        : baseIsWorking;
      
      if (isWorking) {
        setSelectedDate(date);
      }
    }
    
    // Сбрасываем флаги через небольшую задержку
    setTimeout(() => {
      setIsLongPressing(false);
      longPressTriggeredRef.current = false;
    }, 100);
  }, [workingDaysOverrides]);

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
    longPressTriggeredRef.current = false;
  };

  // Генерация календаря с использованием useMemo для пересчета при изменении workingDaysOverrides
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayIndex = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

    const emptyDays = Array.from({ length: startingDayIndex }, (_, i) => (
      <div key={`empty-${i}`} className="calendar-day empty"></div>
    ));

    const days = daysInMonth.map((day) => {
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isCurrentToday = isToday(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Определяем статус дня
      const hasOverride = dateStr in workingDaysOverrides;
      const baseIsWorking = isWorkingDayBase(day);
      const isWorking = hasOverride 
        ? workingDaysOverrides[dateStr] === 'working'
        : baseIsWorking;

      const isPastDay = isBefore(day, startOfDay(new Date()));

      return (
        <div
          key={day.toString()}
          className={`calendar-day admin-day-wrapper ${isSelected ? 'selected-day' : ''} ${isWorking ? 'work-day' : ''} ${isCurrentToday ? 'today' : ''} ${isPastDay ? 'past-day' : ''}`}
        >
          <motion.button
            onClick={() => {
              if (isWorking && window.innerWidth > 768) {
                setSelectedDate(day);
              }
            }}
            onTouchStart={(e) => handleTouchStart(e, day)}
            onTouchEnd={(e) => handleTouchEnd(e, day)}
            onTouchCancel={handleTouchCancel}
            className={`admin-calendar-day-btn ${isSelected ? 'selected' : ''} ${isCurrentToday ? 'today' : ''} ${isWorking ? 'working' : 'off'} ${isPastDay ? 'past-day' : ''}`}
            whileHover={isWorking && window.innerWidth > 768 ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
          >
            <span className="calendar-day__number">{format(day, 'd')}</span>
          </motion.button>
          {isCurrentToday && <div className="calendar-day__today-marker" />}
          <motion.button
            className="admin-calendar-day__toggle-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleDayStatus(day);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title={isWorking ? 'Сделать выходным' : 'Сделать рабочим'}
            type="button"
          >
            {isWorking ? '✓' : '✕'}
          </motion.button>
        </div>
      );
    });

    return [...emptyDays, ...days];
  }, [currentMonth, workingDaysOverrides, selectedDate, handleToggleDayStatus, handleTouchStart, handleTouchEnd, isLongPressing]);

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <motion.div
          className="admin-login__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Админ-панель</h2>
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="admin-login__field">
              <label>Логин</label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="admin-login__field">
              <label>Пароль</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="admin-login__error">{error}</div>}
            <motion.button
              type="submit"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Войти
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="gradient-text">Админ-панель управления записями</h1>
        <motion.button
          onClick={handleLogout}
          className="btn btn-secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Выйти
        </motion.button>
      </div>

      <div className="admin-content">
        <div className="admin-calendar-section">
          <div className="calendar-header">
            <motion.button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="calendar-header__nav-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ‹
            </motion.button>
            <h3 className="calendar-header__title">{format(currentMonth, 'LLLL yyyy', { locale: ru })}</h3>
            <motion.button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="calendar-header__nav-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ›
            </motion.button>
          </div>

          <div className="calendar-weekdays">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="calendar-weekdays__day">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays}
          </div>
        </div>

        {selectedDate && (
          <motion.div
            className="admin-slots-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="admin-slots-header">
              <div>
                <h3>Слоты на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}</h3>
              </div>
              {bookedSlots.length > 0 && (
                <motion.button
                  onClick={handleClearAllSlots}
                  className="btn btn-danger btn-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  Очистить все
                </motion.button>
              )}
            </div>

            {loading ? (
              <div className="admin-loading">Загрузка...</div>
            ) : (
              <div className="admin-slots-grid">
                {timeSlots.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  const slotInfo = bookedSlotsInfo[time];
                  const tooltipText = slotInfo 
                    ? `${slotInfo.name || 'Клиент'}${slotInfo.service ? ` - ${slotInfo.service}` : ''}`
                    : '';
                  
                  return (
                    <motion.div
                      key={time}
                      className="admin-slot-wrapper"
                    >
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Клик по слоту:', time);
                          handleToggleSlot(time);
                        }}
                        className={`admin-slot ${isBooked ? 'booked' : 'free'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        title={isBooked && tooltipText ? tooltipText : (isBooked ? 'Закрыт' : 'Свободен')}
                        type="button"
                      >
                        <span className="admin-slot-time">{time}</span>
                        <span className="admin-slot-status">
                          {isBooked ? '✕ Закрыт' : '✓ Свободен'}
                        </span>
                        {isBooked && slotInfo && (
                          <span className="admin-slot-info">
                            {slotInfo.name && <span className="admin-slot-name">{slotInfo.name}</span>}
                            {slotInfo.service && <span className="admin-slot-service">{slotInfo.service}</span>}
                          </span>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {showSlotForm && (
              <motion.div
                className="admin-slot-form-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSlotForm(false)}
              >
                <motion.div
                  className="admin-slot-form"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Закрыть слот {slotFormData.time}</h3>
                  <div className="admin-slot-form__field">
                    <label>Имя клиента (необязательно)</label>
                    <input
                      type="text"
                      value={slotFormData.name}
                      onChange={(e) => setSlotFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Введите имя"
                    />
                  </div>
                  <div className="admin-slot-form__field">
                    <label>Услуги (можно несколько)</label>
                    <div className="admin-slot-form__services">
                      {(slotFormData.services.length ? slotFormData.services : ['']).map((service, idx) => {
                        const manicureService = pricelistData.manicure.find(s => s.name === service);
                        const pedicureService = pricelistData.pedicure.find(s => s.name === service);
                        const durationLabel = manicureService?.duration || pedicureService?.duration || '';
                        return (
                          <div key={idx} className="admin-slot-form__service-row">
                    <select
                              value={service}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSlotFormData(prev => {
                                  const next = [...(prev.services.length ? prev.services : [''])];
                                  next[idx] = value;
                                  return { ...prev, services: next };
                                });
                              }}
                      className="admin-slot-form__select"
                    >
                              <option value="">Выберите услугу</option>
                              {allServices.map((s, i) => (
                                <option key={i} value={s}>{s}</option>
                      ))}
                    </select>
                            {durationLabel && <span className="admin-slot-form__duration">{durationLabel}</span>}
                            { (slotFormData.services.length ? slotFormData.services : ['']).length > 1 && (
                              <button
                                type="button"
                                className="admin-slot-form__remove"
                                onClick={() => {
                                  setSlotFormData(prev => {
                                    const next = [...(prev.services.length ? prev.services : [''])];
                                    next.splice(idx, 1);
                                    return { ...prev, services: next };
                                  });
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary admin-slot-form__add"
                      onClick={() => setSlotFormData(prev => ({ ...prev, services: [...prev.services, ''] }))}
                    >
                      Добавить услугу
                    </button>
                  </div>
                  <div className="admin-slot-form__field">
                    <label>Комментарий / дополнительная услуга (опционально)</label>
                    <input
                      type="text"
                      value={slotFormData.note}
                      onChange={(e) => setSlotFormData(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Например: коррекция, дизайн и т.п."
                    />
                  </div>
                  <div className="admin-slot-form__summary">
                    <span>Итого длительность: </span>
                    <strong>
                      {(() => {
                        const selected = slotFormData.services.filter(Boolean);
                        const total = calculateTotalDuration(selected);
                        const hours = Math.floor(total / 60);
                        const mins = total % 60;
                        if (total === 0) return '30 мин. (по умолчанию)';
                        if (hours === 0) return `${mins} мин.`;
                        if (mins === 0) return `${hours} ч.`;
                        return `${hours} ч. ${mins} мин.`;
                      })()}
                    </strong>
                  </div>
                  <div className="admin-slot-form__buttons">
                    <motion.button
                      onClick={handleCloseSlot}
                      className="btn btn-primary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      Закрыть слот
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowSlotForm(false);
                        setSlotFormData({ time: '', name: '', services: [], note: '' });
                      }}
                      className="btn btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Отмена
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {!selectedDate && (
          <div className="admin-hint">
            <p>Выберите рабочий день в календаре для управления слотами</p>
            <p className="admin-hint__tip">
              💡 <strong>Совет:</strong> На десктопе - клик по иконке ✓/✕ для переключения статуса. На мобильных - зажмите день на 0.6 секунды для переключения статуса.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

