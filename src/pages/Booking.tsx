import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, getDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import servicesData from '../data/services.json';
import pricelistData from '../data/pricelist.json';
import { LocationIcon, PhoneIcon, SuccessIcon, CheckIcon, ClockIcon, CardIcon, GiftIcon, CalendarIcon } from '../components/Icons';
import { trackBookingSubmit, trackBookingSuccess, trackBookingError, trackPhoneClick, trackTelegramClick } from '../utils/analytics';
import { getBookedSlotsForDate, isSlotBooked, bookSlot, getBookedSlots } from '../utils/bookingSlots';
import './Booking.scss';

const Booking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedSlotsMap, setBookedSlotsMap] = useState<Record<string, string[]>>({});

  // Загружаем занятые слоты при монтировании и при смене месяца
  useEffect(() => {
    const loadBookedSlots = async () => {
      try {
        const slots = await getBookedSlots();
        // Группируем по датам
        const slotsByDate: Record<string, string[]> = {};
        slots.forEach(slot => {
          if (!slotsByDate[slot.date]) {
            slotsByDate[slot.date] = [];
          }
          slotsByDate[slot.date].push(slot.time);
        });
        setBookedSlotsMap(slotsByDate);
      } catch (error) {
        console.error('Ошибка при загрузке занятых слотов:', error);
      }
    };
    
    loadBookedSlots();
  }, [currentMonth]);

  // Функция определения рабочих дней согласно новому расписанию
  const isWorkingDay = (date: Date): boolean => {
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
      
      // Первые 3 дня после 29 января - выходные, затем цикл 4 дня
      if (daysDiff >= 4) {
        const adjustedDays = daysDiff - 4; // Смещаем на начало следующего цикла
        const cycleDay = adjustedDays % 4;
        return cycleDay < 2; // Первые 2 дня цикла - рабочие
      }
      return false;
    }
    
    return false;
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

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что выбранные дата и время не заняты
    if (selectedDate && selectedTime) {
      const isBooked = await isSlotBooked(selectedDate, selectedTime);
      if (isBooked) {
        alert('К сожалению, это время уже занято. Пожалуйста, выберите другое время.');
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
    trackBookingSubmit(formData.service, dateStr, selectedTime || undefined);
    
    // Используем переменные окружения Vite (префикс VITE_)
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    
    // Проверка наличия обязательных переменных окружения
    if (!botToken || !chatId) {
      const errorMsg = 'Отсутствуют переменные окружения для Telegram бота';
      trackBookingError(errorMsg);
      alert('Ошибка конфигурации: не настроены переменные окружения для Telegram бота. Обратитесь к администратору сайта.');
      console.error('Отсутствуют переменные окружения: VITE_TELEGRAM_BOT_TOKEN или VITE_TELEGRAM_CHAT_ID');
      return;
    }
    
    // Сначала бронируем слот, потом отправляем в Telegram
    if (selectedDate && selectedTime) {
      const booked = await bookSlot(selectedDate, selectedTime, formData.name, formData.phone, formData.service);
      if (!booked) {
        // Если не удалось забронировать (например, уже занято), показываем ошибку
        alert('К сожалению, это время уже занято. Пожалуйста, выберите другое время.');
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
    
    const message = `🎯 *Новая заявка на запись*\n\n` +
      `👤 *Имя:* ${formData.name}\n` +
      `📞 *Телефон:* ${formData.phone}\n` +
      `💅 *Услуга:* ${formData.service}\n` +
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
          service: '',
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
        alert('Запись забронирована, но произошла ошибка при отправке уведомления. Пожалуйста, свяжитесь со мной напрямую по телефону для подтверждения.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      trackBookingError(errorMsg);
      console.error('Ошибка при отправке заявки:', error);
      // Слот уже забронирован, но Telegram не отправился - уведомляем пользователя
      alert('Запись забронирована, но произошла ошибка при отправке уведомления. Пожалуйста, свяжитесь со мной напрямую по телефону для подтверждения.');
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
                  
                  return (
                    <motion.button
                      key={time}
                      className={`btn btn-secondary booking-time-slot ${isSelected ? 'selected-time' : ''} ${isBooked ? 'booked-time' : ''}`}
                      disabled={isBooked}
                      whileHover={!isSelected && !isBooked ? { 
                        scale: 1.05,
                        background: 'var(--primary-rose)',
                        color: 'var(--text-white)',
                        borderColor: 'var(--primary-rose)'
                      } : {}}
                      whileTap={!isBooked ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (!isBooked) {
                          setSelectedTime(time);
                        }
                      }}
                      title={isBooked ? 'Это время уже занято' : ''}
                    >
                      {time}
                      {isBooked && <span className="booking-time-slot__booked-icon">✕</span>}
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
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Выберите услугу *</option>
                  {services.map((service, index) => (
                    <option key={index} value={service}>{service}</option>
                  ))}
                </select>
                {(selectedDate || selectedTime) && (
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
    </div>
  );
};

export default Booking;

