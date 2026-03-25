import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, getDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import servicesData from '../data/services.json';
import pricelistData from '../data/pricelist.json';
import { LocationIcon, PhoneIcon, SuccessIcon, CheckIcon, ClockIcon, CardIcon, GiftIcon, CalendarIcon } from '../components/Icons';
import { trackBookingSubmit, trackBookingSuccess, trackBookingError, trackPhoneClick, trackTelegramClick } from '../utils/analytics';
import { getBookedSlotsForDate, isSlotBooked, bookSlot, getBookedSlots } from '../utils/bookingSlots';
import { isWorkingDayBase, loadWorkingDaysOverrides } from '../utils/workingDays';
import Modal from '../components/Modal';
import './Booking.scss';

const Booking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    services: [] as string[], // Массив выбранных услуг
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedSlotsMap, setBookedSlotsMap] = useState<Record<string, string[]>>({});
  const [workingDaysOverrides, setWorkingDaysOverrides] = useState<Record<string, 'working' | 'off'>>({});
  const [modal, setModal] = useState<{ isOpen: boolean; title?: string; message: string; type?: 'error' | 'info' | 'success' | 'warning' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Загружаем занятые слоты и переопределения рабочих дней при монтировании и при смене месяца
  useEffect(() => {
    const loadData = async () => {
      try {
        const [slots, overrides] = await Promise.all([
          getBookedSlots(),
          loadWorkingDaysOverrides(),
        ]);

        const slotsByDate: Record<string, string[]> = {};
        slots.forEach(slot => {
          if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
          slotsByDate[slot.date].push(slot.time);
        });
        setBookedSlotsMap(slotsByDate);
        setWorkingDaysOverrides(overrides);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };

    loadData();
  }, [currentMonth]);

  // Определяем рабочий ли день — сначала проверяем override из админки, затем базовое расписание
  const isWorkingDay = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (dateStr in workingDaysOverrides) {
      return workingDaysOverrides[dateStr] === 'working';
    }
    return isWorkingDayBase(date);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  let startingDayIndex = getDay(monthStart);
  if (startingDayIndex === 0) startingDayIndex = 6;
  else startingDayIndex -= 1;
  
  const calendarDays = Array.from({ length: startingDayIndex }, (_, i) => <div key={`empty-${i}`} className="calendar-day empty"></div>);

  daysInMonth.forEach((day) => {
    const isWorking = isWorkingDay(day);
    // Блокируем только сегодня и прошедшие дни
    // Можно записаться минимум на завтра (согласно правилу "за 1-2 дня до процедуры")
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const isPast = isBefore(day, tomorrow);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isCurrentToday = isToday(day);
    // Проверяем, есть ли занятые слоты на эту дату
    const dateStr = format(day, 'yyyy-MM-dd');
    const hasBookedSlots = bookedSlotsMap[dateStr] && bookedSlotsMap[dateStr].length > 0;

    calendarDays.push(
      <motion.button
        key={day.toString()}
        onClick={() => {
          if (!isPast && isWorking) {
            setSelectedDate(day);
          }
        }}
        disabled={isPast || !isWorking}
        className={`calendar-day ${isWorking ? 'work-day' : ''} ${isPast ? 'past-day' : ''} ${isSelected ? 'selected-day' : ''} ${isCurrentToday ? 'today' : ''} ${hasBookedSlots ? 'has-bookings' : ''}`}
        whileHover={isWorking && !isPast ? { scale: 1.05 } : {}}
        whileTap={isWorking && !isPast ? { scale: 0.95 } : {}}
        title={hasBookedSlots ? 'На этот день есть записи' : ''}
      >
        <span className="calendar-day__number">{format(day, 'd')}</span>
        {isCurrentToday && <div className="calendar-day__today-marker" />}
        {hasBookedSlots && !isSelected && <div className="calendar-day__bookings-marker" />}
      </motion.button>
    );
  });

  // Генерируем получасовые слоты с 09:00 до 20:00 (последний слот 20:00)
  const timeSlots = React.useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 20) { // 20:30 не добавляем, последний слот 20:00
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  // Сбрасываем выбранное время, если оно стало занятым при изменении даты
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const booked = bookedSlotsMap[dateStr] || [];
      if (booked.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, selectedTime, bookedSlotsMap]);

  // Автопрокрутка при выборе времени - к форме записи
  useEffect(() => {
    if (selectedTime) {
      setTimeout(() => {
        const formElement = document.querySelector('.booking-form-card');
        if (formElement) {
          const elementPosition = formElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 150; // Отступ сверху 150px
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [selectedTime]);

  // Функция для парсинга длительности в минуты
  const parseDurationToMinutes = (duration: string): number => {
    let totalMinutes = 0;
    
    // Ищем часы
    const hoursMatch = duration.match(/(\d+)\s*ч/);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }
    
    // Ищем минуты
    const minutesMatch = duration.match(/(\d+)\s*мин/);
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }
    
    return totalMinutes;
  };

  // Функция для расчета общего времени
  const calculateTotalDuration = (selectedServices: string[]): number => {
    if (selectedServices.length === 0) return 0;
    
    let totalMinutes = 0;
    
    // Находим длительность каждой услуги
    selectedServices.forEach(serviceName => {
      // Ищем в manicure
      const manicureService = pricelistData.manicure.find(s => s.name === serviceName);
      if (manicureService) {
        totalMinutes += parseDurationToMinutes(manicureService.duration);
      } else {
        // Ищем в pedicure
        const pedicureService = pricelistData.pedicure.find(s => s.name === serviceName);
        if (pedicureService) {
          totalMinutes += parseDurationToMinutes(pedicureService.duration);
        }
      }
    });
    
    return totalMinutes;
  };

  // Форматирование времени в читаемый вид
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} мин.`;
    } else if (mins === 0) {
      return `${hours} ч.`;
    } else {
      return `${hours} ч. ${mins} мин.`;
    }
  };

  // Проверка, не выходит ли конец процедуры за 21:00
  const isProcedureEndsAfterWorkingHours = (startTime: string, durationMinutes: number): boolean => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    
    // Проверяем, не выходит ли конец процедуры за 21:00
    return endHour > 21 || (endHour === 21 && endMinute > 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleServiceChange = (index: number, serviceName: string) => {
    setFormData(prev => {
      const newServices = [...prev.services];
      if (serviceName === '') {
        // Удаляем услугу
        newServices.splice(index, 1);
      } else {
        // Обновляем услугу
        newServices[index] = serviceName;
        // Если это последний элемент и выбранная услуга не пустая, добавляем пустой элемент для следующего выбора
        if (index === newServices.length - 1 && serviceName !== '') {
          newServices.push('');
        }
      }
      return {
        ...prev,
        services: newServices
      };
    });
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // Получаем доступные услуги (исключая уже выбранные)
  const getAvailableServices = (currentIndex: number) => {
    const selectedServices = formData.services.filter((_, i) => i !== currentIndex);
    return services.filter(service => !selectedServices.includes(service));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка, что выбрана хотя бы одна услуга
    if (formData.services.length === 0) {
      setModal({
        isOpen: true,
        message: 'Пожалуйста, выберите хотя бы одну услугу',
        type: 'warning'
      });
      return;
    }
    
    // Проверяем, не выходит ли конец процедуры за 21:00
    if (selectedTime && formData.services.length > 0) {
      const totalDuration = calculateTotalDuration(formData.services);
      if (isProcedureEndsAfterWorkingHours(selectedTime, totalDuration)) {
        const durationText = formatDuration(totalDuration);
        setModal({
          isOpen: true,
          message: `К сожалению, выбранные процедуры (${durationText}) не поместятся в рабочее время, так как закончатся после 21:00.\n\nПожалуйста, выберите более ранний временной слот.`,
          type: 'warning'
        });
        return;
      }
    }
    
    // Проверяем, что выбранные дата и время не заняты
    if (selectedDate && selectedTime && formData.services.length > 0) {
      const totalDuration = calculateTotalDuration(formData.services);
      const isBooked = await isSlotBooked(selectedDate, selectedTime, totalDuration);
      if (isBooked) {
        setModal({
          isOpen: true,
          message: 'К сожалению, это время уже занято. Пожалуйста, выберите другое время.',
          type: 'error'
        });
        setSelectedTime('');
        // Обновляем список занятых слотов
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slots = await getBookedSlotsForDate(selectedDate);
        setBookedSlotsMap(prev => ({ ...prev, [dateStr]: slots }));
        return;
      }
    }
    
    // Отслеживание отправки формы
    const dateStr = selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : undefined;
    trackBookingSubmit(formData.services.join(', '), dateStr, selectedTime || undefined);
    
    // Используем переменные окружения Vite (префикс VITE_)
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    
    // Проверка наличия обязательных переменных окружения
    if (!botToken || !chatId) {
      const errorMsg = 'Отсутствуют переменные окружения для Telegram бота';
      trackBookingError(errorMsg);
      setModal({
        isOpen: true,
        title: 'Ошибка конфигурации',
        message: 'Не настроены переменные окружения для Telegram бота. Обратитесь к администратору сайта.',
        type: 'error'
      });
      console.error('Отсутствуют переменные окружения: VITE_TELEGRAM_BOT_TOKEN или VITE_TELEGRAM_CHAT_ID');
      return;
    }
    
    // Сначала бронируем слот(ы), потом отправляем в Telegram
    if (selectedDate && selectedTime) {
      const servicesText = formData.services.join(', ');
      const totalDuration = calculateTotalDuration(formData.services);
      const booked = await bookSlot(
        selectedDate, 
        selectedTime, 
        formData.name, 
        formData.phone, 
        servicesText,
        totalDuration // Передаем длительность для блокировки нескольких слотов
      );
      if (!booked) {
        // Если не удалось забронировать (например, уже занято), показываем ошибку
        const numberOfSlots = totalDuration > 0 ? Math.ceil(totalDuration / 30) : 1;
        if (numberOfSlots > 1) {
          const durationText = formatDuration(totalDuration);
          setModal({
            isOpen: true,
            message: `К сожалению, не все необходимые слоты доступны (требуется ${durationText}).\n\nПожалуйста, выберите другое время.`,
            type: 'error'
          });
        } else {
          setModal({
            isOpen: true,
            message: 'К сожалению, это время уже занято. Пожалуйста, выберите другое время.',
            type: 'error'
          });
        }
        setSelectedTime('');
        // Обновляем список занятых слотов
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slots = await getBookedSlotsForDate(selectedDate);
        setBookedSlotsMap(prev => ({ ...prev, [dateStr]: slots }));
        return; // Не отправляем в Telegram, если бронирование не удалось
      }
      
      // Обновляем локальный кэш занятых слотов
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const updatedSlots = await getBookedSlotsForDate(selectedDate);
      setBookedSlotsMap(prev => ({ ...prev, [dateStr]: updatedSlots }));
    }
    
    const totalDuration = calculateTotalDuration(formData.services);
    const servicesText = formData.services.length === 1 
      ? formData.services[0] 
      : formData.services.join(', ');
    const durationText = totalDuration > 0 ? `\n⏱ *Длительность:* ${formatDuration(totalDuration)}` : '';
    
    const message = `🎯 *Новая заявка на запись*\n\n` +
      `👤 *Имя:* ${formData.name}\n` +
      `📞 *Телефон:* ${formData.phone}\n` +
      `💅 *Услуги:* ${servicesText}${durationText}\n` +
      `${selectedDate ? `📅 *Дата:* ${format(selectedDate, 'd MMMM yyyy', { locale: ru })}\n` : ''}` +
      `${selectedTime ? `⏰ *Время:* ${selectedTime}\n` : ''}` +
      `${formData.message ? `💬 *Сообщение:* ${formData.message}\n` : ''}` +
      `\n_Время отправки: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: ru })}_`;
    
    try {
      // Теперь отправляем в Telegram (только если бронирование успешно)
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      
      if (response.ok) {
        // Отслеживание успешной отправки
        trackBookingSuccess();
        setIsSubmitted(true);
        setFormData({
          name: '',
          phone: '',
          services: [],
          message: ''
        });
        setSelectedDate(null);
        setSelectedTime('');
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        const errorData = await response.json();
        const errorMsg = `Telegram API error: ${errorData.description || 'Unknown error'}`;
        trackBookingError(errorMsg);
        console.error('Ошибка отправки в Telegram:', errorData);
        // Слот уже забронирован, но Telegram не отправился - уведомляем пользователя
        setModal({
          isOpen: true,
          title: 'Запись забронирована',
          message: 'Произошла ошибка при отправке уведомления. Пожалуйста, свяжитесь со мной напрямую по телефону для подтверждения.',
          type: 'warning'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      trackBookingError(errorMsg);
      console.error('Ошибка при отправке заявки:', error);
      // Слот уже забронирован, но Telegram не отправился - уведомляем пользователя
      setModal({
        isOpen: true,
        title: 'Запись забронирована',
        message: 'Произошла ошибка при отправке уведомления. Пожалуйста, свяжитесь со мной напрямую по телефону для подтверждения.',
        type: 'warning'
      });
    }
  };

  const phoneNumber = '8-916-142-78-95';
  const telegramLink = `https://t.me/${phoneNumber.replace(/[-\s]/g, '')}`;
  const whatsappLink = `https://wa.me/79161427895`;
  const imoLink = `https://imo.im/79161427895`;

  // Генерируем список услуг из прайс-листа
  const services = React.useMemo(() => {
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

  return (
    <div className="container booking-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Записаться на процедуру</h1>
        <p className="booking-intro">Выберите удобную дату и время, заполните форму или свяжитесь со мной напрямую</p>
      </motion.div>

      {/* Верхняя секция: Календарь и слоты времени в одинаковых боксах */}
      <div className="booking-top-section">
        {/* Календарь */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="booking-top-card"
        >
          <div className="card">
            <div className="calendar-header">
              <motion.button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="calendar-header__nav-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ‹
              </motion.button>
              
              <h3 className="calendar-header__title">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </h3>
              
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

            <div className="calendar-legend">
              <div className="calendar-legend__item">
                <div className="calendar-legend__color-box work-day" />
                <span>Рабочий день</span>
              </div>
              <div className="calendar-legend__item">
                <div className="calendar-legend__color-box" />
                <span>Выходной</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Выбор времени */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="booking-top-card"
        >
          {selectedDate ? (
            <div className="card booking-time-slots">
              <h4 className="booking-time-slots__title">
                Доступное время на {format(selectedDate, 'd MMMM', { locale: ru })}
              </h4>
              <div className="booking-time-slots__grid">
                {timeSlots.map((time, index) => {
                  const isSelected = selectedTime === time;
                  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                  const isBooked = selectedDate ? (bookedSlotsMap[dateStr] || []).includes(time) : false;
                  
                  // Вычисляем, будет ли этот слот заблокирован выбранными услугами
                  let isBlockedBySelection = false;
                  let isTooLateForDuration = false;
                  
                  if (formData.services.length > 0) {
                    const totalDuration = calculateTotalDuration(formData.services);
                    
                    // Проверяем, не выходит ли конец процедуры за 21:00
                    if (isProcedureEndsAfterWorkingHours(time, totalDuration)) {
                      isTooLateForDuration = true;
                    }
                    
                    if (isSelected) {
                      // Количество получасовых слотов (округление вверх)
                      const numberOfSlots = totalDuration > 0 ? Math.ceil(totalDuration / 30) : 1;
                      const selectedIndex = timeSlots.indexOf(selectedTime);
                      const currentIndex = timeSlots.indexOf(time);
                      // Проверяем, попадает ли текущий слот в диапазон заблокированных слотов
                      isBlockedBySelection = currentIndex >= selectedIndex && currentIndex < selectedIndex + numberOfSlots;
                    }
                  }
                  
                  const isDisabled = isBooked || (isBlockedBySelection && !isSelected) || isTooLateForDuration;
                  
                  return (
                    <motion.button
                      key={time}
                      className={`btn btn-secondary booking-time-slot ${isSelected ? 'selected-time' : ''} ${isBooked ? 'booked-time' : ''} ${isBlockedBySelection && !isSelected ? 'blocked-time' : ''}`}
                      disabled={isDisabled}
                      whileHover={!isSelected && !isDisabled ? { 
                        scale: 1.05,
                        background: 'var(--primary-rose)',
                        color: 'var(--text-white)',
                        borderColor: 'var(--primary-rose)'
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedTime(time);
                        }
                      }}
                      title={
                        isBooked 
                          ? 'Это время уже занято' 
                          : isTooLateForDuration
                          ? 'Процедура закончится после 21:00. Пожалуйста, выберите более раннее время'
                          : isBlockedBySelection && !isSelected
                          ? 'Будет заблокировано выбранными услугами'
                          : ''
                      }
                    >
                      {time}
                      {isBooked && <span className="booking-time-slot__booked-icon">✕</span>}
                      {isBlockedBySelection && !isSelected && !isBooked && (
                        <span className="booking-time-slot__blocked-icon">🔒</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card booking-hours">
              <h4 className="booking-hours__title">Время работы</h4>
              <div className="booking-hours__time">9:00 - 21:00</div>
              <p className="booking-hours__hint">Выберите дату в календаре, чтобы увидеть доступное время</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Нижняя секция: Форма и контакты в одинаковых боксах */}
      <div className="booking-bottom-section">
        {/* Форма записи */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="booking-bottom-card"
        >
          <div className="card booking-form-card">
            <h3 className="card-title">Записаться</h3>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="form-success-message"
              >
                <div className="form-success-message__icon">
                  <SuccessIcon size={48} color="var(--primary-gold)" />
                </div>
                <h4 className="form-success-message__title">Заявка отправлена!</h4>
                <p>Я свяжусь с вами в ближайшее время.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="booking-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Ваше имя *"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Телефон *"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
                <div className="form-services">
                  <label className="form-services__label">Выберите услуги *</label>
                  <div className="form-services__list">
                    {formData.services.map((selectedService, index) => {
                      const availableServices = getAvailableServices(index);
                      // Находим длительность выбранной услуги
                      const manicureService = pricelistData.manicure.find(s => s.name === selectedService);
                      const pedicureService = pricelistData.pedicure.find(s => s.name === selectedService);
                      const serviceData = manicureService || pedicureService;
                      const duration = serviceData?.duration || '';
                      
                      return (
                        <div key={index} className="form-services__item">
                          <div className="form-services__select-wrapper">
                            <select
                              value={selectedService}
                              onChange={(e) => handleServiceChange(index, e.target.value)}
                              className="form-input form-services__select"
                              required={index === 0}
                            >
                              <option value="">Выберите услугу {index === 0 ? '*' : ''}</option>
                              {availableServices.map((service) => (
                                <option key={service} value={service}>{service}</option>
                              ))}
                            </select>
                            {selectedService && duration && (
                              <span className="form-services__duration-badge">{duration}</span>
                            )}
                            {formData.services.length > 1 && (
                              <motion.button
                                type="button"
                                className="form-services__remove-btn"
                                onClick={() => handleRemoveService(index)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Удалить услугу"
                              >
                                ✕
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {formData.services.length === 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            // Добавляем выбранную услугу и пустой элемент для следующего выбора
                            setFormData(prev => ({
                              ...prev,
                              services: [e.target.value, '']
                            }));
                          }
                        }}
                        className="form-input form-services__select"
                        required
                      >
                        <option value="">Выберите услугу *</option>
                        {services.map((service) => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {formData.services.length > 0 && (
                    <div className="form-services__summary">
                      <span className="form-services__total">
                        Выбрано: {formData.services.length} {formData.services.length === 1 ? 'услуга' : formData.services.length < 5 ? 'услуги' : 'услуг'}
                        {(() => {
                          const totalDuration = calculateTotalDuration(formData.services);
                          return totalDuration > 0 ? ` • Общее время: ${formatDuration(totalDuration)}` : '';
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                {(selectedDate || selectedTime || formData.services.length > 0) && (
                  <div className="form-selected-info">
                    {selectedDate && (
                      <div className="form-selected-info__item">
                        <CalendarIcon size={20} color="var(--primary-rose)" />
                        <span>Выбранная дата: {format(selectedDate, 'd MMMM yyyy', { locale: ru })}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="form-selected-info__item">
                        <ClockIcon size={20} color="var(--primary-rose)" />
                        <span>Выбранное время: {selectedTime}</span>
                      </div>
                    )}
                    {formData.services.length > 0 && (
                      <div className="form-selected-info__item">
                        <CardIcon size={20} color="var(--primary-rose)" />
                        <span>
                          Услуги: {formData.services.join(', ')}
                          {(() => {
                            const totalDuration = calculateTotalDuration(formData.services);
                            return totalDuration > 0 ? ` (${formatDuration(totalDuration)})` : '';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <textarea
                  name="message"
                  placeholder="Дополнительные пожелания или вопросы"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className="form-input"
                />
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Отправить заявку
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Контакты */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="booking-bottom-card"
        >
          <div className="card booking-contacts">
            <h3 className="card-title">Контакты</h3>
            <div className="booking-contacts__list">
              <motion.div
                className="booking-contacts__item"
                whileHover={{ scale: 1.02 }}
                onClick={() => window.open('https://yandex.ru/maps/', '_blank')}
              >
                <LocationIcon size={24} color="var(--primary-rose)" />
                <div>
                  <div className="booking-contacts__label">Адрес</div>
                  <div className="booking-contacts__value">г. Железнодорожный, ул. Маяковского д. 12, 1 подъезд, 1 этаж, 101</div>
                </div>
              </motion.div>
              <motion.div
                className="booking-contacts__item"
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  trackPhoneClick();
                  window.open(`tel:${phoneNumber.replace(/[-\s]/g, '')}`);
                }}
              >
                <PhoneIcon size={24} color="var(--primary-rose)" />
                <div>
                  <div className="booking-contacts__label">Телефон</div>
                  <div className="booking-contacts__value">{phoneNumber}</div>
                </div>
              </motion.div>
            </div>
            <div className="booking-contacts__buttons">
              <motion.a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => trackTelegramClick()}
              >
                Telegram
              </motion.a>
              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                WhatsApp
              </motion.a>
              <motion.a
                href={imoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                imo
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Условия записи */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
        className="booking-conditions-wrapper"
      >
        <div className="card booking-conditions">
          <h3 className="card-title">Условия записи</h3>
          <div className="booking-conditions__grid">
            {servicesData.bookingInfo.conditions.map((condition, index) => (
              <motion.div
                key={index}
                className="booking-conditions__item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="booking-conditions__icon">
                  {condition.icon === '✓' && <CheckIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '⏰' && <ClockIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '💳' && <CardIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '🎁' && <GiftIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '📅' && <CalendarIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '🕐' && <ClockIcon size={20} color="var(--primary-gold)" />}
                  {condition.icon === '📱' && <PhoneIcon size={20} color="var(--primary-gold)" />}
                </div>
                <div className="booking-conditions__content">
                  <div className="booking-conditions__label">{condition.label}</div>
                  <div className="booking-conditions__value">{condition.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Модальное окно для уведомлений */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default Booking;

