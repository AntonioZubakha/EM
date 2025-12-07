import React from 'react';
import { motion } from 'framer-motion';
import { LocationIcon, PhoneIcon } from '../components/Icons';
import { trackPhoneClick, trackTelegramClick } from '../utils/analytics';
import './Contacts.scss';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const Contacts: React.FC = () => {
  const phoneNumber = '+7 916 142-78-95';
  const phoneRaw = phoneNumber.replace(/[^\d+]/g, '');
  const phoneDigits = phoneRaw.replace(/^\+/, '');
  const telegramLink = `https://t.me/${phoneDigits}`;
  const whatsappLink = `https://wa.me/${phoneDigits}`;
  const imoLink = `https://imo.im/${phoneDigits}`;

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
          {/* Фото фасада */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="contacts-card__facade"
          >
            <img
              src={withBase('facade-building.png')}
              alt="Фасад здания"
              className="contacts-card__facade-image"
              loading="lazy"
            />
          </motion.div>

          <div className="contacts-card__list">
            <motion.div
              className="contacts-card__item"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.open('https://yandex.ru/maps/', '_blank')}
            >
              <LocationIcon size={24} color="var(--primary-rose)" />
              <div>
                <div className="contacts-card__label">Адрес</div>
                <div className="contacts-card__value">
                  г. Железнодорожный, ул. Маяковского д. 12, 1 подъезд, 1 этаж, 101
                  <br />
                  <span className="contacts-card__hint">В подъезде сразу налево, второй раз налево и третий раз налево</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="contacts-card__item"
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                trackPhoneClick();
                window.open(`tel:${phoneRaw}`);
              }}
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
              onClick={() => trackTelegramClick()}
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

