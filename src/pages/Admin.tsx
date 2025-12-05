import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getBookedSlotsForDate, releaseSlot } from '../utils/bookingSlots';
import { isWorkingDayBase, setDayStatus, removeDayOverride, loadWorkingDaysOverrides } from '../utils/workingDays';
import pricelistData from '../data/pricelist.json';
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
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<Record<string, { name?: string; service?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [workingDaysOverrides, setWorkingDaysOverrides] = useState<Record<string, 'working' | 'off'>>({});
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotFormData, setSlotFormData] = useState({ time: '', name: '', service: '' });

  const timeSlots = [
    '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

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

  // Проверка авторизации при загрузке
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
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
  }, [selectedDate, workingDaysOverrides]);

  const loadBookedSlots = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Получаем полную информацию о слотах
      const response = await fetch(`${API_BASE_URL}/booked-slots?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        const slotsForDate = data.bookedSlots.filter((slot: any) => slot.date === dateStr);
        
        const times = slotsForDate.map((slot: any) => slot.time);
        const info: Record<string, { name?: string; service?: string }> = {};
        
        slotsForDate.forEach((slot: any) => {
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
  };

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
      setSlotFormData({ time, name: '', service: '' });
      setShowSlotForm(true);
    }
  };

  const handleCloseSlot = async () => {
    if (!selectedDate || !slotFormData.time) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const response = await fetch(`${API_BASE_URL}/booked-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          time: slotFormData.time,
          name: slotFormData.name || 'Админ',
          service: slotFormData.service || 'Закрыто администратором',
        }),
      });
      
      if (response.ok) {
        setBookedSlots(prev => [...prev, slotFormData.time]);
        setBookedSlotsInfo(prev => ({
          ...prev,
          [slotFormData.time]: {
            name: slotFormData.name || 'Админ',
            service: slotFormData.service || 'Закрыто администратором',
          },
        }));
        setShowSlotForm(false);
        setSlotFormData({ time: '', name: '', service: '' });
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
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Удаляем все слоты по одному
      for (const time of bookedSlots) {
        await fetch(`${API_BASE_URL}/booked-slots/${dateStr}/${time}`, {
          method: 'DELETE',
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

  const handleToggleDayStatus = async (date: Date) => {
    console.log('handleToggleDayStatus вызвана для:', format(date, 'yyyy-MM-dd'));
    const dateStr = format(date, 'yyyy-MM-dd');
    const baseIsWorking = isWorkingDayBase(date);
    const hasOverride = dateStr in workingDaysOverrides;
    
    let newStatus: 'working' | 'off';
    
    if (hasOverride) {
      // Если есть переопределение, переключаем на противоположное
      newStatus = workingDaysOverrides[dateStr] === 'working' ? 'off' : 'working';
    } else {
      // Если нет переопределения, создаем противоположное базовому
      newStatus = baseIsWorking ? 'off' : 'working';
    }
    
    console.log('Текущий статус:', hasOverride ? workingDaysOverrides[dateStr] : (baseIsWorking ? 'working' : 'off'));
    console.log('Новый статус:', newStatus);
    
    setLoading(true);
    try {
      const success = await setDayStatus(date, newStatus);
      console.log('Результат setDayStatus:', success);
      if (success) {
        setWorkingDaysOverrides(prev => {
          const updated = { ...prev, [dateStr]: newStatus };
          console.log('Обновленные переопределения:', updated);
          return updated;
        });
        // Если день стал выходным и был выбран, сбрасываем выбор
        if (newStatus === 'off' && selectedDate && isSameDay(date, selectedDate)) {
          setSelectedDate(null);
          setBookedSlots([]);
        }
      } else {
        console.error('setDayStatus вернул false');
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса дня:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverride = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    setLoading(true);
    try {
      const success = await removeDayOverride(date);
      if (success) {
        const newOverrides = { ...workingDaysOverrides };
        delete newOverrides[dateStr];
        setWorkingDaysOverrides(newOverrides);
        // Если день стал выходным и был выбран, сбрасываем выбор
        const baseIsWorking = isWorkingDayBase(date);
        if (!baseIsWorking && selectedDate && isSameDay(date, selectedDate)) {
          setSelectedDate(null);
          setBookedSlots([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении переопределения:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация календаря с использованием useMemo для пересчета при изменении workingDaysOverrides
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayIndex = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

    const emptyDays = Array.from({ length: startingDayIndex }, (_, i) => (
      <div key={`empty-${i}`} className="admin-calendar-day-wrapper empty"></div>
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

      return (
        <div
          key={day.toString()}
          className={`admin-calendar-day-wrapper ${isSelected ? 'selected' : ''}`}
        >
          <motion.button
            onClick={() => {
              // Обычный клик - выбор дня (только для рабочих дней)
              if (isWorking) {
                setSelectedDate(day);
              }
            }}
            className={`admin-calendar-day ${isSelected ? 'selected' : ''} ${isCurrentToday ? 'today' : ''} ${isWorking ? 'working' : 'off'} ${hasOverride ? 'overridden' : ''}`}
            whileHover={isWorking ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            title={hasOverride 
              ? `${isWorking ? 'Рабочий' : 'Выходной'} (изменено). Клик по иконке для изменения`
              : `${isWorking ? 'Рабочий день' : 'Выходной'}. Клик по иконке для изменения`}
          >
            <span>{format(day, 'd')}</span>
          </motion.button>
          <motion.button
            className="admin-calendar-day__toggle-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleDayStatus(day);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleDayStatus(day);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title="Переключить статус дня"
            type="button"
          >
            {hasOverride ? '⚙' : (isWorking ? '✓' : '✕')}
          </motion.button>
        </div>
      );
    });

    return [...emptyDays, ...days];
  }, [currentMonth, workingDaysOverrides, selectedDate]);

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
              <div>
                <h3>Слоты на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}</h3>
                {(() => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const hasOverride = dateStr in workingDaysOverrides;
                  if (hasOverride) {
                    return (
                      <div className="admin-slots-header__info">
                        <span className="admin-slots-header__override-badge">
                          ⚙ Изменено администратором
                        </span>
                        <motion.button
                          onClick={() => handleRemoveOverride(selectedDate)}
                          className="btn btn-secondary btn-xs"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={loading}
                          title="Вернуть к автоматическому расписанию"
                        >
                          Вернуть автоматически
                        </motion.button>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                    <label>Процедура (необязательно)</label>
                    <select
                      value={slotFormData.service}
                      onChange={(e) => setSlotFormData(prev => ({ ...prev, service: e.target.value }))}
                      className="admin-slot-form__select"
                    >
                      <option value="">Выберите процедуру или оставьте пустым</option>
                      {allServices.map((service, index) => (
                        <option key={index} value={service}>{service}</option>
                      ))}
                    </select>
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
                        setSlotFormData({ time: '', name: '', service: '' });
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
              💡 <strong>Совет:</strong> Ctrl+клик или правый клик по дню для изменения статуса (рабочий/выходной)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

