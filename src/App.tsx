import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import About from './pages/About';
import Cabinet from './pages/Cabinet';
import Services from './pages/Services';
import PriceList from './pages/PriceList';
import Portfolio from './pages/Portfolio';
import Booking from './pages/Booking';

function App() {
  const [activeSection, setActiveSection] = useState('about');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'cabinet', 'services', 'pricelist', 'portfolio', 'booking'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
