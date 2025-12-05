import React, { useState } from 'react';
import { motion } from 'framer-motion';
import pricelistData from '../data/pricelist.json';
import { ManicureIcon, PedicureIcon, ClockIcon, CheckIcon, LightbulbIcon } from '../components/Icons';
import { trackBookingClick } from '../utils/analytics';
import './PriceList.scss';

const PriceList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'manicure' | 'pedicure'>('manicure');

  const categories = [
    { id: 'manicure', label: 'Маникюр', icon: <ManicureIcon size={24} color="currentColor" /> },
    { id: 'pedicure', label: 'Педикюр', icon: <PedicureIcon size={24} color="currentColor" /> }
  ];

  return (
    <div className="container pricelist-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Прейскурант</h1>
        <div className="pricelist-intro">
          <p className="pricelist-intro__subtitle">
            Прозрачные цены на все услуги. Стоимость включает консультацию и все необходимые материалы.
          </p>
        </div>
      </motion.div>

      {/* Переключатель категорий */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="pricelist-toggle"
      >
        <div className="pricelist-toggle__container">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id as 'manicure' | 'pedicure')}
              className={`pricelist-toggle__button ${activeCategory === category.id ? 'active' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pricelist-toggle__icon">{category.icon}</span>
              {category.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Таблица услуг - десктоп, карточки - мобильные */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="price-table-wrapper"
      >
        {/* Десктопная таблица */}
        <div className="card price-table-card price-table-card--desktop">
          <table className="price-table">
            <thead>
              <tr>
                <th className="price-table__header price-table__header--service">Услуга</th>
                <th className="price-table__header price-table__header--description">Описание</th>
                <th className="price-table__header price-table__header--duration">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClockIcon size={18} color="currentColor" />
                    Время
                  </span>
                </th>
                <th className="price-table__header price-table__header--price">Цена</th>
                <th className="price-table__header price-table__header--action"></th>
              </tr>
            </thead>
            <tbody>
              {pricelistData[activeCategory].map((service, index) => (
                <motion.tr
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="price-table__row"
                >
                  <td className="price-table__cell price-table__cell--service">
                    <strong>{service.name}</strong>
                  </td>
                  <td className="price-table__cell price-table__cell--description">
                    {service.description}
                  </td>
                  <td className="price-table__cell price-table__cell--duration">
                    {service.duration}
                  </td>
                  <td className="price-table__cell price-table__cell--price">
                    <strong>{service.price}</strong>
                  </td>
                  <td className="price-table__cell price-table__cell--action">
                    <motion.button
                      className="btn btn-primary btn-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        trackBookingClick(`PriceList: ${service.name}`);
                        const bookingElement = document.getElementById('booking');
                        if (bookingElement) {
                          bookingElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Записаться
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Мобильные карточки */}
        <div className="price-cards price-cards--mobile">
          {pricelistData[activeCategory].map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="card price-card"
            >
              <div className="price-card__header">
                <h3 className="price-card__title">{service.name}</h3>
                <div className="price-card__price">{service.price}</div>
              </div>
              <div className="price-card__body">
                <p className="price-card__description">{service.description}</p>
                <div className="price-card__meta">
                  <div className="price-card__meta-item">
                    <ClockIcon size={18} color="var(--primary-rose)" />
                    <span>{service.duration}</span>
                  </div>
                </div>
              </div>
              <div className="price-card__footer">
                <motion.button
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    trackBookingClick(`PriceList: ${service.name}`);
                    const bookingElement = document.getElementById('booking');
                    if (bookingElement) {
                      bookingElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Записаться
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Дополнительная информация */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="mt-5"
      >
        <div className="card card--accent-gradient" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 className="card-title--light text-center">
            <span className="info-title-icon">
              <LightbulbIcon size={24} color="var(--primary-gold)" />
            </span>
            Полезная информация
          </h3>
          <ul className="info-list">
            <li className="info-list__item">
              <span className="info-list__icon">
                <CheckIcon size={20} color="var(--primary-gold)" />
              </span>
              Все материалы включены в стоимость
            </li>
            <li className="info-list__item">
              <span className="info-list__icon">
                <CheckIcon size={20} color="var(--primary-gold)" />
              </span>
              Стерильные инструменты
            </li>
            <li className="info-list__item">
              <span className="info-list__icon">
                <CheckIcon size={20} color="var(--primary-gold)" />
              </span>
              Индивидуальный подход
            </li>
            <li className="info-list__item">
              <span className="info-list__icon">
                <CheckIcon size={20} color="var(--primary-gold)" />
              </span>
              Гарантия качества
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default PriceList;
