// Утилиты для Google Analytics 4

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

/**
 * Отслеживание просмотра страницы/секции
 */
export const trackPageView = (sectionId: string, sectionName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: `/#${sectionId}`,
      page_title: sectionName,
      page_location: window.location.href,
    });
  }
};

/**
 * Отслеживание клика по навигации
 */
export const trackNavigationClick = (sectionId: string, sectionName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'navigation_click', {
      section_id: sectionId,
      section_name: sectionName,
      event_category: 'Navigation',
      event_label: sectionName,
    });
  }
};

/**
 * Отслеживание клика по кнопке записи
 */
export const trackBookingClick = (source: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_click', {
      event_category: 'Booking',
      event_label: source,
      value: 1,
    });
  }
};

/**
 * Отслеживание отправки формы записи
 */
export const trackBookingSubmit = (service: string, date?: string, time?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_submit', {
      event_category: 'Booking',
      event_label: service,
      service_name: service,
      booking_date: date,
      booking_time: time,
      value: 1,
    });
  }
};

/**
 * Отслеживание успешной отправки формы
 */
export const trackBookingSuccess = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_success', {
      event_category: 'Booking',
      event_label: 'Form Submitted Successfully',
      value: 1,
    });
  }
};

/**
 * Отслеживание ошибки отправки формы
 */
export const trackBookingError = (error: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_error', {
      event_category: 'Booking',
      event_label: error,
      value: 0,
    });
  }
};

/**
 * Отслеживание клика по телефону
 */
export const trackPhoneClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'phone_click', {
      event_category: 'Contact',
      event_label: 'Phone Number Clicked',
      value: 1,
    });
  }
};

/**
 * Отслеживание клика по Telegram
 */
export const trackTelegramClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'telegram_click', {
      event_category: 'Contact',
      event_label: 'Telegram Link Clicked',
      value: 1,
    });
  }
};

/**
 * Отслеживание просмотра портфолио
 */
export const trackPortfolioView = (imageIndex?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'portfolio_view', {
      event_category: 'Portfolio',
      event_label: imageIndex !== undefined ? `Image ${imageIndex + 1}` : 'Portfolio Section',
      value: 1,
    });
  }
};

/**
 * Отслеживание клика по услуге
 */
export const trackServiceClick = (serviceName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'service_click', {
      event_category: 'Services',
      event_label: serviceName,
      value: 1,
    });
  }
};

