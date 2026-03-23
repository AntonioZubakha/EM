import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import About from './pages/About';
import Cabinet from './pages/Cabinet';
import Services from './pages/Services';
import PriceList from './pages/PriceList';
import Portfolio from './pages/Portfolio';
import Contacts from './pages/Contacts';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import { trackPageView, trackNavigationClick } from './utils/analytics';

const NAV_ITEMS = [
  { id: 'about',     label: 'Обо мне'     },
  { id: 'cabinet',   label: 'Мой кабинет' },
  { id: 'services',  label: 'Услуги'      },
  { id: 'pricelist', label: 'Прейскурант' },
  { id: 'portfolio', label: 'Мои работы'  },
  { id: 'contacts',  label: 'Контакты'    },
  { id: 'booking',   label: 'Записаться'  },
];

function App() {
  const [activeSection, setActiveSection] = useState('about');
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Проверка админ-роута
  useEffect(() => {
    const checkAdminRoute = () => {
      const hash = window.location.hash;
      setIsAdminRoute(hash === '#admin');
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setMenuOpen(false);

      const sectionNames: Record<string, string> = {
        about: 'Обо мне', cabinet: 'Мой кабинет', services: 'Услуги',
        pricelist: 'Прейскурант', portfolio: 'Мои работы',
        contacts: 'Контакты', booking: 'Записаться',
      };
      trackNavigationClick(sectionId, sectionNames[sectionId] || sectionId);
    }
  };

  useEffect(() => {
    trackPageView('about', 'Обо мне');

    const handleScroll = () => {
      const sections = NAV_ITEMS.map(i => i.id);
      const current = sections.find(section => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current && current !== activeSection) {
        setActiveSection(current);
        const sectionNames: Record<string, string> = {
          about: 'Обо мне', cabinet: 'Мой кабинет', services: 'Услуги',
          pricelist: 'Прейскурант', portfolio: 'Мои работы',
          contacts: 'Контакты', booking: 'Записаться',
        };
        trackPageView(current, sectionNames[current] || current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  if (isAdminRoute) return <Admin />;

  return (
    <div className="app">
      {/* ── HEADER ── */}
      <header className="header">
        <nav className="nav">
          <motion.div
            className="nav-container"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo */}
            <div className="logo" onClick={() => scrollToSection('about')} style={{ cursor: 'pointer' }}>
              <h2>Елена</h2>
              <span>Мастер ногтевого сервиса</span>
            </div>

            {/* Desktop nav */}
            <ul className="nav-list">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                >
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                </motion.li>
              ))}
            </ul>

            {/* Hamburger */}
            <button
              className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Меню"
            >
              <span />
              <span />
              <span />
            </button>
          </motion.div>
        </nav>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="nav-drawer open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {NAV_ITEMS.map((item, i) => (
              <motion.button
                key={item.id}
                className={`nav-drawer__link ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => scrollToSection(item.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <main className="main" role="main">
        <section id="about"     className="section" aria-label="О мастере"><About /></section>
        <section id="cabinet"   className="section" aria-label="Мой кабинет"><Cabinet /></section>
        <section id="services"  className="section" aria-label="Услуги"><Services /></section>
        <section id="pricelist" className="section" aria-label="Прейскурант"><PriceList /></section>
        <section id="portfolio" className="section" aria-label="Портфолио работ"><Portfolio /></section>
        <section id="contacts"  className="section" aria-label="Контакты"><Contacts /></section>
        <section id="booking"   className="section" aria-label="Записаться на процедуру"><Booking /></section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Елена</div>
          <div className="footer-tagline">Мастер ногтевого сервиса</div>
          <p>&copy; 2025 elena-manicure.ru. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
