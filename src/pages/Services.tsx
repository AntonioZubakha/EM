import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import servicesData from '../data/services.json';
import { ManicureIcon, PedicureIcon, ChildrenIcon, MenIcon, CheckIcon } from '../components/Icons';
import { trackBookingClick, trackServiceClick } from '../utils/analytics';
import './Services.scss';

const Services: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manicure');

  const getServiceIcon = (id: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      manicure: <ManicureIcon size={28} color="var(--primary-rose)" />,
      pedicure: <PedicureIcon size={28} color="var(--primary-rose)" />,
      children: <ChildrenIcon size={28} color="var(--primary-rose)" />,
      men: <MenIcon size={28} color="var(--primary-rose)" />
    };
    return icons[id] || null;
  };

  const activeService = servicesData.services.find(s => s.category === activeTab) || servicesData.services[0];

  return (
    <div className="container services-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Услуги</h1>
      </motion.div>

      {/* Вкладки */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="services-tabs"
      >
        {servicesData.services.map((service) => (
          <motion.button
            key={service.id}
            onClick={() => setActiveTab(service.category)}
            className={`services-tab ${activeTab === service.category ? 'active' : ''}`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="services-tab__icon">{getServiceIcon(service.id)}</span>
            <span className="services-tab__text">{service.name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Контент вкладки */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="services-content"
        >
          <div className="service-detail-card">
            <div className="service-detail-header">
              <div className="service-detail-icon">{getServiceIcon(activeService.id)}</div>
              <div>
                <h2 className="service-detail-title">{activeService.name}</h2>
                <p className="service-detail-description">{activeService.description}</p>
              </div>
            </div>

            {activeService.items && activeService.items.length > 0 && (
              <div className="service-detail-section">
                <h3 className="service-detail-section-title">Виды услуг:</h3>
                <div className="service-items-grid">
                  {activeService.items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="service-item-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="service-item-card__check">
                        <CheckIcon size={20} color="var(--text-white)" />
                      </div>
                      <span className="service-item-card__text">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeService.includes && activeService.includes.length > 0 && (
              <div className="service-detail-section">
                <h3 className="service-detail-section-title">Это включает:</h3>
                <ul className="service-includes-list">
                  {activeService.includes.map((item, index) => (
                    <motion.li
                      key={index}
                      className="service-includes-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className="service-includes-item__icon">—</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            <motion.button
              className="btn btn-primary service-detail-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Отслеживание клика по кнопке записи
                trackBookingClick(`Services: ${activeService.name}`);
                trackServiceClick(activeService.name);
                
                const bookingElement = document.getElementById('booking');
                if (bookingElement) {
                  bookingElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {activeService.category === 'children' 
                ? 'Записаться на детские процедуры'
                : activeService.category === 'men'
                ? 'Записаться для мужчин'
                : `Записаться на ${activeService.name.toLowerCase()}`
              }
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Services;
