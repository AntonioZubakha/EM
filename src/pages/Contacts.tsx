import React from 'react';
import { motion } from 'framer-motion';
import { LocationIcon, PhoneIcon } from '../components/Icons';
import './Contacts.scss';

const Contacts: React.FC = () => {
  const phoneNumber = '8-916-142-78-95';
  const telegramLink = `https://t.me/${phoneNumber.replace(/[-\s]/g, '')}`;
  const whatsappLink = `https://wa.me/79161427895`;
  const imoLink = `https://imo.im/79161427895`;

  return (
    <div className="container contacts-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Контакты</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="contacts-container"
      >
        <div className="card contacts-card">
          <div className="contacts-card__list">
            <motion.div
              className="contacts-card__item"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.open('https://yandex.ru/maps/', '_blank')}
            >
              <LocationIcon size={24} color="var(--primary-rose)" />
              <div>
                <div className="contacts-card__label">Адрес</div>
                <div className="contacts-card__value">г. Железнодорожный, ул. Маяковского д. 12, 1 подъезд, 1 этаж, 101</div>
              </div>
            </motion.div>
            <motion.div
              className="contacts-card__item"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.open(`tel:${phoneNumber.replace(/[-\s]/g, '')}`)}
            >
              <PhoneIcon size={24} color="var(--primary-rose)" />
              <div>
                <div className="contacts-card__label">Телефон</div>
                <div className="contacts-card__value">{phoneNumber}</div>
              </div>
            </motion.div>
          </div>
          <div className="contacts-card__buttons">
            <motion.a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Telegram
            </motion.a>
            <motion.a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              WhatsApp
            </motion.a>
            <motion.a
              href={imoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              imo
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contacts;

