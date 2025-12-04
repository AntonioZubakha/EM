import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import About from './pages/About';
import Cabinet from './pages/Cabinet';
import Services from './pages/Services';
import PriceList from './pages/PriceList';
import Portfolio from './pages/Portfolio';
import Contacts from './pages/Contacts';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import { trackPageView, trackNavigationClick } from './utils/analytics';

function App() {
  const [activeSection, setActiveSection] = useState('about');
  const [isAdminRoute, setIsAdminRoute] = useState(false);

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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      
      // Отслеживание навигации в Google Analytics
      const sectionNames: Record<string, string> = {
        about: 'Обо мне',
        cabinet: 'Мой кабинет',
        services: 'Услуги',
        pricelist: 'Прейскурант',
        portfolio: 'Мои работы',
        contacts: 'Контакты',
        booking: 'Записаться',
      };
      const sectionName = sectionNames[sectionId] || sectionId;
      trackNavigationClick(sectionId, sectionName);
    }
  };

  useEffect(() => {
    // Отслеживание первой загрузки страницы
    trackPageView('about', 'Обо мне');
    
    const handleScroll = () => {
      const sections = ['about', 'cabinet', 'services', 'pricelist', 'portfolio', 'contacts', 'booking'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
        
        // Отслеживание просмотра секции в Google Analytics
        const sectionNames: Record<string, string> = {
          about: 'Обо мне',
          cabinet: 'Мой кабинет',
          services: 'Услуги',
          pricelist: 'Прейскурант',
          portfolio: 'Мои работы',
          contacts: 'Контакты',
          booking: 'Записаться',
        };
        const sectionName = sectionNames[currentSection] || currentSection;
        trackPageView(currentSection, sectionName);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Если админ-роут, показываем только админку
  if (isAdminRoute) {
    return <Admin />;
  }

  return (
    <div className="app">
      <header className="header">
        <nav className="nav">
          <motion.div 
            className="nav-container"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="logo">
              <h2>Елена</h2>
              <span>Мастер ногтевого сервиса</span>
            </div>
            <ul className="nav-list">
              {[
                { id: 'about', label: 'Обо мне' },
                { id: 'cabinet', label: 'Мой кабинет' },
                { id: 'services', label: 'Услуги' },
                { id: 'pricelist', label: 'Прейскурант' },
                { id: 'portfolio', label: 'Мои работы' },
                { id: 'contacts', label: 'Контакты' },
                { id: 'booking', label: 'Записаться' }
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </nav>
      </header>

      <main className="main" role="main">
        <section id="about" className="section" aria-label="О мастере">
          <About />
        </section>
        
        <section id="cabinet" className="section" aria-label="Мой кабинет">
          <Cabinet />
        </section>
        
        <section id="services" className="section" aria-label="Услуги">
          <Services />
        </section>
        
        <section id="pricelist" className="section" aria-label="Прейскурант">
          <PriceList />
        </section>
        
        <section id="portfolio" className="section" aria-label="Портфолио работ">
          <Portfolio />
        </section>

        <section id="contacts" className="section" aria-label="Контакты">
          <Contacts />
        </section>

        <section id="booking" className="section" aria-label="Записаться на процедуру">
          <Booking />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 elena-manicure.ru. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
