import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, getDay, isBefore, startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { getBookedSlotsForDate, releaseSlot } from '../utils/bookingSlots';
import { isWorkingDayBase, setDayStatus, loadWorkingDaysOverrides } from '../utils/workingDays';
import pricelistData from '../data/pricelist.json';
import './Admin.scss';

const ADMIN_LOGIN = import.meta.env.VITE_ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const AUTH_PERSIST_KEY = 'admin_auth_persist';
const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SlotFormData = { time: string; name: string; services: string[]; note: string };

const parseDurationToMinutes = (d: string): number => {
  let m = 0;
  const h = d.match(/(\d+)\s*ч/);
  if (h) m += parseInt(h[1]) * 60;
  const mn = d.match(/(\d+)\s*мин/);
  if (mn) m += parseInt(mn[1]);
  return m;
};

const calculateTotalDuration = (svcs: string[]): number => {
  if (!svcs.length) return 0;
  return svcs.reduce((acc, name) => {
    const s = pricelistData.manicure.find(x => x.name === name)
      ?? pricelistData.pedicure.find(x => x.name === name);
    return acc + (s ? parseDurationToMinutes(s.duration) : 0);
  }, 0);
};

const getNextTimeSlots = (start: string, mins: number): string[] => {
  const slots: string[] = [];
  const [h, m] = start.split(':').map(Number);
  const count = Math.ceil(mins / 30);
  let cur = h * 60 + m;
  for (let i = 0; i < count; i++) {
    const hr = Math.floor(cur / 60), mn = cur % 60;
    if (hr > 20 || (hr === 20 && mn > 0)) break;
    slots.push(`${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`);
    cur += 30;
  }
  return slots;
};

interface BookedSlotData { date: string; time: string; name?: string; service?: string }

// ── Long-press toggle button (2 seconds) ─────────────────────────────────────
const LONG_PRESS_MS = 2000;

const DayToggleButton: React.FC<{
  isWorking: boolean;
  isPast: boolean;
  onToggle: () => void;
}> = ({ isWorking, isPast, onToggle }) => {
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = (e: React.PointerEvent) => {
    if (isPast) return;
    e.preventDefault();
    e.stopPropagation();
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      onToggle();
    }, LONG_PRESS_MS);
  };

  const cancel = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setPressing(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <button
      className={`cal-day__toggle${pressing ? ' cal-day__toggle--pressing' : ''}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      type="button"
      disabled={isPast}
      aria-label={isWorking ? 'Удерживайте 2 сек. для отметки выходным' : 'Удерживайте 2 сек. для отметки рабочим'}
      title={isWorking ? 'Удержать 2 сек. → сделать выходным' : 'Удержать 2 сек. → сделать рабочим'}
    >
      {isWorking ? '✓' : '✕'}
    </button>
  );
};

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<Record<string, { name?: string; service?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [workingDaysOverrides, setWorkingDaysOverrides] = useState<Record<string, 'working' | 'off'>>({});
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotFormData, setSlotFormData] = useState<SlotFormData>({ time: '', name: '', services: [], note: '' });

  const slotsPanelRef = useRef<HTMLElement>(null);

  const timeSlots = useMemo(() => {
    const s: string[] = [];
    for (let h = 9; h <= 20; h++) {
      s.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 20) s.push(`${String(h).padStart(2, '0')}:30`);
    }
    return s;
  }, []);

  const allServices = useMemo(() => [
    ...pricelistData.manicure.map(s => s.name),
    ...pricelistData.pedicure.map(s => s.name),
  ], []);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') { setIsAuthenticated(true); return; }
    try {
      const raw = localStorage.getItem(AUTH_PERSIST_KEY);
      if (raw) {
        const { value, expires } = JSON.parse(raw);
        if (value === 'true' && expires > Date.now()) {
          setIsAuthenticated(true);
          sessionStorage.setItem('admin_auth', 'true');
        } else if (expires <= Date.now()) {
          localStorage.removeItem(AUTH_PERSIST_KEY);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadWorkingDaysOverrides().then(setWorkingDaysOverrides);
  }, [isAuthenticated, currentMonth]);

  // Auto-scroll to slots panel when date selected on mobile
  useEffect(() => {
    if (selectedDate && slotsPanelRef.current && window.innerWidth < 768) {
      setTimeout(() => slotsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [selectedDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!ADMIN_PASSWORD) { setLoginError('Панель не настроена.'); return; }
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify({ value: 'true', expires: Date.now() + AUTH_TTL_MS }));
    } else {
      setLoginError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    localStorage.removeItem(AUTH_PERSIST_KEY);
    setSelectedDate(null);
    setBookedSlots([]);
  };

  // ── Slots loading ─────────────────────────────────────────────
  const loadBookedSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`${API}/booked-slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        const daySlots = (data.bookedSlots as BookedSlotData[]).filter(s => s.date === dateStr);
        setBookedSlots(daySlots.map(s => s.time));
        const info: Record<string, { name?: string; service?: string }> = {};
        daySlots.forEach(s => { info[s.time] = { name: s.name, service: s.service }; });
        setBookedSlotsInfo(info);
      } else {
        setBookedSlots(await getBookedSlotsForDate(selectedDate));
        setBookedSlotsInfo({});
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isWorking = dateStr in workingDaysOverrides
      ? workingDaysOverrides[dateStr] === 'working'
      : isWorkingDayBase(selectedDate);
    if (isWorking) { loadBookedSlots(); }
    else { setBookedSlots([]); setSelectedDate(null); }
  }, [selectedDate, workingDaysOverrides, loadBookedSlots]);

  // ── Day actions ───────────────────────────────────────────────
  const handleDaySelect = useCallback((day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isWorking = dateStr in workingDaysOverrides
      ? workingDaysOverrides[dateStr] === 'working'
      : isWorkingDayBase(day);
    if (isWorking) setSelectedDate(day);
  }, [workingDaysOverrides]);

  const handleToggleDayStatus = useCallback(async (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isWorking = dateStr in workingDaysOverrides
      ? workingDaysOverrides[dateStr] === 'working'
      : isWorkingDayBase(day);
    const newStatus: 'working' | 'off' = isWorking ? 'off' : 'working';
    setLoading(true);
    try {
      const ok = await setDayStatus(day, newStatus);
      if (ok) {
        setWorkingDaysOverrides(prev => ({ ...prev, [dateStr]: newStatus }));
        if (newStatus === 'off' && selectedDate && isSameDay(day, selectedDate)) {
          setSelectedDate(null);
          setBookedSlots([]);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [workingDaysOverrides, selectedDate]);

  // ── Slot actions ──────────────────────────────────────────────
  const handleToggleSlot = async (time: string) => {
    if (!selectedDate) return;
    if (bookedSlots.includes(time)) {
      const info = bookedSlotsInfo[time];
      const clientStr = info?.name ? ` (${info.name}${info.service ? ` — ${info.service}` : ''})` : '';
      if (!confirm(`Освободить слот ${time}${clientStr}?`)) return;
      setLoading(true);
      try {
        if (await releaseSlot(selectedDate, time)) {
          setBookedSlots(p => p.filter(s => s !== time));
          setBookedSlotsInfo(p => { const u = { ...p }; delete u[time]; return u; });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    } else {
      setSlotFormData({ time, name: '', services: [], note: '' });
      setShowSlotForm(true);
    }
  };

  const handleCloseSlot = async () => {
    if (!selectedDate || !slotFormData.time) return;
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const selectedSvcs = slotFormData.services.filter(Boolean);
      let svcText = selectedSvcs.join(', ');
      if (slotFormData.note) svcText = svcText ? `${svcText} (${slotFormData.note})` : slotFormData.note;
      if (!svcText) svcText = 'Закрыто администратором';
      const duration = calculateTotalDuration(selectedSvcs) || 30;
      const slotsToBook = getNextTimeSlots(slotFormData.time, duration);
      const res = await fetch(`${API}/booked-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr, time: slotFormData.time,
          name: slotFormData.name || 'Админ', service: svcText, durationMinutes: duration,
        }),
      });
      if (res.ok) {
        const updated = await getBookedSlotsForDate(selectedDate);
        setBookedSlots(updated);
        setBookedSlotsInfo(p => {
          const u = { ...p };
          slotsToBook.forEach(s => { u[s] = { name: slotFormData.name || 'Админ', service: svcText }; });
          return u;
        });
        setShowSlotForm(false);
        setSlotFormData({ time: '', name: '', services: [], note: '' });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClearAllSlots = async () => {
    if (!selectedDate || !confirm('Очистить все слоты на этот день?')) return;
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const adminToken = import.meta.env.VITE_ADMIN_TOKEN;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      for (const time of bookedSlots) {
        await fetch(`${API}/booked-slots/${dateStr}/${time}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken || '' },
        });
      }
      setBookedSlots([]);
      setBookedSlotsInfo({});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Calendar cells ────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end: endOfMonth(currentMonth) });
    const offset = getDay(start) === 0 ? 6 : getDay(start) - 1;
    const today = startOfDay(new Date());

    const empties = Array.from({ length: offset }, (_, i) => (
      <div key={`e-${i}`} className="cal-day cal-day--empty" aria-hidden="true" />
    ));

    const cells = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWorking = dateStr in workingDaysOverrides
        ? workingDaysOverrides[dateStr] === 'working'
        : isWorkingDayBase(day);
      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
      const isCurToday = isToday(day);
      const isPast = isBefore(day, today);

      return (
        <div
          key={day.toString()}
          className={[
            'cal-day',
            isWorking ? 'cal-day--working' : 'cal-day--off',
            isSelected ? 'cal-day--selected' : '',
            isCurToday ? 'cal-day--today' : '',
            isPast ? 'cal-day--past' : '',
          ].filter(Boolean).join(' ')}
        >
          <button
            className="cal-day__sel"
            onClick={() => !isPast && handleDaySelect(day)}
            type="button"
            disabled={!isWorking || isPast}
            aria-label={`${format(day, 'd MMMM', { locale: ru })}${isWorking ? ', рабочий' : ', выходной'}`}
          >
            <span className="cal-day__num">{format(day, 'd')}</span>
            {isCurToday && <span className="cal-day__today-dot" aria-hidden="true" />}
          </button>
          <DayToggleButton
            isWorking={isWorking}
            isPast={isPast}
            onToggle={() => handleToggleDayStatus(day)}
          />
        </div>
      );
    });

    return [...empties, ...cells];
  }, [currentMonth, workingDaysOverrides, selectedDate, handleDaySelect, handleToggleDayStatus]);

  // ── Duration label ────────────────────────────────────────────
  const durationLabel = (() => {
    const total = calculateTotalDuration(slotFormData.services.filter(Boolean));
    if (!total) return '30 мин (по умолчанию)';
    const h = Math.floor(total / 60), m = total % 60;
    return h && m ? `${h} ч ${m} мин` : h ? `${h} ч` : `${m} мин`;
  })();

  // ════════════════════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="adm-login">
        <motion.div
          className="adm-login__card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="adm-login__icon" aria-hidden="true">✦</div>
          <h2>Управление записями</h2>
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="adm-field">
              <label htmlFor="adm-u">Логин</label>
              <input
                id="adm-u" type="text" name="username" autoComplete="username"
                value={login} onChange={e => setLogin(e.target.value)}
                required autoFocus placeholder="Введите логин"
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-p">Пароль</label>
              <input
                id="adm-p" type="password" name="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Введите пароль"
              />
            </div>
            {loginError && <div className="adm-login__error" role="alert">{loginError}</div>}
            <button type="submit" className="adm-btn adm-btn--primary adm-btn--full">
              Войти
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MAIN PANEL
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="adm">
      {/* ── STICKY HEADER ────────────────────────────────────── */}
      <header className="adm-header">
        <div className="adm-header__left">
          <span className="adm-header__icon" aria-hidden="true">✦</span>
          <span className="adm-header__title">Расписание</span>
        </div>
        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={handleLogout} type="button">
          <span aria-hidden="true">⏻</span>
          <span className="adm-btn__label">Выйти</span>
        </button>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="adm-main">

        {/* Calendar */}
        <section className="adm-cal" aria-label="Календарь">
          <div className="adm-cal__nav">
            <motion.button
              className="adm-cal__nav-btn"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              whileTap={{ scale: 0.88 }} type="button" aria-label="Предыдущий месяц"
            >‹</motion.button>
            <h2 className="adm-cal__month">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <motion.button
              className="adm-cal__nav-btn"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              whileTap={{ scale: 0.88 }} type="button" aria-label="Следующий месяц"
            >›</motion.button>
          </div>

          <div className="adm-cal__weekdays" aria-hidden="true">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <div key={d} className="adm-cal__wd">{d}</div>
            ))}
          </div>

          <div className="adm-cal__grid" role="grid" aria-label="Дни месяца">
            {calendarDays}
          </div>

          <div className="adm-cal__legend" aria-hidden="true">
            <span className="adm-cal__legend-item adm-cal__legend-item--working">✓ рабочий</span>
            <span className="adm-cal__legend-item adm-cal__legend-item--off">✕ выходной</span>
            <span className="adm-cal__legend-tip">✓/✕ — смена статуса дня</span>
          </div>
        </section>

        {/* Slots panel */}
        <AnimatePresence>
          {selectedDate ? (
            <motion.section
              ref={slotsPanelRef}
              className="adm-slots"
              key="slots-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              aria-label={`Слоты на ${format(selectedDate, 'd MMMM', { locale: ru })}`}
            >
              <div className="adm-slots__header">
                <div className="adm-slots__date">
                  <span className="adm-slots__date-day">{format(selectedDate, 'd')}</span>
                  <span className="adm-slots__date-rest">
                    {format(selectedDate, 'MMMM yyyy', { locale: ru })}
                    {bookedSlots.length > 0 && (
                      <span className="adm-slots__badge">{bookedSlots.length} занято</span>
                    )}
                  </span>
                </div>
                <div className="adm-slots__actions">
                  {bookedSlots.length > 0 && (
                    <button
                      className="adm-btn adm-btn--danger adm-btn--sm"
                      onClick={handleClearAllSlots}
                      disabled={loading} type="button"
                    >
                      Очистить всё
                    </button>
                  )}
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--icon"
                    onClick={() => { setSelectedDate(null); setBookedSlots([]); }}
                    type="button" aria-label="Закрыть панель"
                  >✕</button>
                </div>
              </div>

              {loading ? (
                <div className="adm-slots__loading">
                  <div className="adm-spinner" aria-label="Загрузка" />
                  <span>Загрузка...</span>
                </div>
              ) : (
                <div className="adm-slots__grid">
                  {timeSlots.map(time => {
                    const isBooked = bookedSlots.includes(time);
                    const info = bookedSlotsInfo[time];
                    return (
                      <motion.button
                        key={time}
                        className={`adm-slot ${isBooked ? 'adm-slot--booked' : 'adm-slot--free'}`}
                        onClick={() => handleToggleSlot(time)}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                        type="button"
                        title={isBooked && info
                          ? `${info.name || 'Клиент'}${info.service ? ` — ${info.service}` : ''}`
                          : (isBooked ? 'Занято' : 'Свободно — нажмите для закрытия')}
                      >
                        <span className="adm-slot__time">{time}</span>
                        <span className="adm-slot__indicator" aria-hidden="true" />
                        {isBooked && info && (
                          <span className="adm-slot__info">
                            {info.name && <span className="adm-slot__name">{info.name}</span>}
                            {info.service && <span className="adm-slot__svc">{info.service}</span>}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div
              className="adm-empty"
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="adm-empty__icon" aria-hidden="true">📅</span>
              <p>Выберите рабочий день для управления слотами</p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── SLOT FORM MODAL (bottom-sheet on mobile) ─────────── */}
      <AnimatePresence>
        {showSlotForm && (
          <motion.div
            className="adm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSlotForm(false)}
            aria-modal="true"
            role="dialog"
            aria-label={`Закрыть слот ${slotFormData.time}`}
          >
            <motion.div
              className="adm-form"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="adm-form__drag-hint" aria-hidden="true" />

              <div className="adm-form__header">
                <h3>Слот <strong>{slotFormData.time}</strong></h3>
                <button
                  className="adm-btn adm-btn--ghost adm-btn--icon"
                  onClick={() => setShowSlotForm(false)}
                  type="button" aria-label="Закрыть"
                >✕</button>
              </div>

              <div className="adm-field">
                <label htmlFor="slot-name">Имя клиента</label>
                <input
                  id="slot-name" type="text"
                  value={slotFormData.name}
                  onChange={e => setSlotFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Необязательно" autoComplete="off"
                />
              </div>

              <div className="adm-field">
                <label>Услуги</label>
                <div className="adm-svcs">
                  {(slotFormData.services.length ? slotFormData.services : ['']).map((svc, i) => {
                    const found = pricelistData.manicure.find(s => s.name === svc)
                      ?? pricelistData.pedicure.find(s => s.name === svc);
                    const dur = found?.duration ?? '';
                    const rows = slotFormData.services.length ? slotFormData.services : [''];
                    return (
                      <div key={i} className="adm-svcs__row">
                        <select
                          value={svc}
                          onChange={e => setSlotFormData(p => {
                            const next = [...(p.services.length ? p.services : [''])];
                            next[i] = e.target.value;
                            return { ...p, services: next };
                          })}
                          aria-label={`Услуга ${i + 1}`}
                        >
                          <option value="">Выберите услугу</option>
                          {allServices.map((s, j) => <option key={j} value={s}>{s}</option>)}
                        </select>
                        {dur && <span className="adm-svcs__dur">{dur}</span>}
                        {rows.length > 1 && (
                          <button
                            type="button" className="adm-svcs__del"
                            aria-label="Удалить услугу"
                            onClick={() => setSlotFormData(p => {
                              const next = [...(p.services.length ? p.services : [''])];
                              next.splice(i, 1);
                              return { ...p, services: next };
                            })}
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--full"
                  onClick={() => setSlotFormData(p => ({ ...p, services: [...p.services, ''] }))}
                >+ Добавить услугу</button>
              </div>

              <div className="adm-field">
                <label htmlFor="slot-note">Комментарий</label>
                <input
                  id="slot-note" type="text"
                  value={slotFormData.note}
                  onChange={e => setSlotFormData(p => ({ ...p, note: e.target.value }))}
                  placeholder="Дополнительно..." autoComplete="off"
                />
              </div>

              <div className="adm-form__summary">
                <span>Длительность</span>
                <strong>{durationLabel}</strong>
              </div>

              <div className="adm-form__btns">
                <button
                  className="adm-btn adm-btn--primary adm-btn--full"
                  onClick={handleCloseSlot}
                  disabled={loading} type="button"
                >Закрыть слот</button>
                <button
                  className="adm-btn adm-btn--ghost adm-btn--full"
                  onClick={() => { setShowSlotForm(false); setSlotFormData({ time: '', name: '', services: [], note: '' }); }}
                  type="button"
                >Отмена</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
