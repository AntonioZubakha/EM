import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getBookedSlotsForDate, releaseSlot } from '../utils/bookingSlots';
import './Admin.scss';

const ADMIN_LOGIN = 'ElenaK';
const ADMIN_PASSWORD = 'DanikMaster124$';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // Проверка авторизации при загрузке
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    setSelectedDate(null);
    setBookedSlots([]);
  };

  // Загрузка занятых слотов при выборе даты
  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots();
    }
  }, [selectedDate]);

  const loadBookedSlots = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const slots = await getBookedSlotsForDate(selectedDate);
      setBookedSlots(slots);
    } catch (error) {
      console.error('Ошибка при загрузке слотов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = async (time: string) => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      if (bookedSlots.includes(time)) {
        // Освобождаем слот
        const success = await releaseSlot(selectedDate, time);
        if (success) {
          setBookedSlots(prev => prev.filter(slot => slot !== time));
        }
      } else {
        // Закрываем слот (используем API для бронирования с пустыми данными)
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        const response = await fetch(`${API_BASE_URL}/booked-slots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: dateStr,
            time,
            name: 'Админ',
            service: 'Закрыто администратором',
          }),
        });
        
        if (response.ok) {
          setBookedSlots(prev => [...prev, time]);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении слота:', error);
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
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Удаляем все слоты по одному
      for (const time of bookedSlots) {
        await fetch(`${API_BASE_URL}/booked-slots/${dateStr}/${time}`, {
          method: 'DELETE',
        });
      }
      
      setBookedSlots([]);
    } catch (error) {
      console.error('Ошибка при очистке слотов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация календаря
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayIndex = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const calendarDays = Array.from({ length: startingDayIndex }, (_, i) => (
    <div key={`empty-${i}`} className="admin-calendar-day empty"></div>
  ));

  daysInMonth.forEach((day) => {
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isCurrentToday = isToday(day);

    calendarDays.push(
      <motion.button
        key={day.toString()}
        onClick={() => setSelectedDate(day)}
        className={`admin-calendar-day ${isSelected ? 'selected' : ''} ${isCurrentToday ? 'today' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{format(day, 'd')}</span>
      </motion.button>
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <motion.div
          className="admin-login__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Админ-панель</h2>
          <form onSubmit={handleLogin}>
            <div className="admin-login__field">
              <label>Логин</label>
              <input
                type="text"
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
        <h1>Админ-панель управления записями</h1>
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
          <div className="admin-calendar-header">
            <motion.button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="admin-calendar-nav"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ‹
            </motion.button>
            <h2>{format(currentMonth, 'LLLL yyyy', { locale: ru })}</h2>
            <motion.button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="admin-calendar-nav"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ›
            </motion.button>
          </div>

          <div className="admin-calendar-grid">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="admin-calendar-weekday">{day}</div>
            ))}
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
              <h3>Слоты на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}</h3>
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
                  return (
                    <motion.button
                      key={time}
                      onClick={() => handleToggleSlot(time)}
                      className={`admin-slot ${isBooked ? 'booked' : 'free'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      <span>{time}</span>
                      <span className="admin-slot-status">
                        {isBooked ? '✕ Закрыт' : '✓ Свободен'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {!selectedDate && (
          <div className="admin-hint">
            <p>Выберите дату в календаре для управления слотами</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

