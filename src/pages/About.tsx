import React from 'react';
import { motion } from 'framer-motion';
import aboutData from '../data/about.json';
import './About.scss';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const About: React.FC = () => {
  // Функция для правильного склонения слова "год"
  const getYearWord = (years: number): string => {
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'лет';
    }
    if (lastDigit === 1) {
      return 'год';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'года';
    }
    return 'лет';
  };

  return (
    <div className="container about-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="page-intro"
      >
        <h1 className="page-intro__title">Обо мне</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        viewport={{ once: true }}
        className="about-subtitle"
      >
        <p className="about-subtitle__text">
          Красота и здоровье ногтей, безопасные покрытия, сложные педикюры, чистота, стерильность
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="about-header-center"
      >
        <h2 className="about-name">{aboutData.name}</h2>
        <div className="experience-badge">
          Опыт работы: {aboutData.experience} {getYearWord(aboutData.experience)}
        </div>
      </motion.div>

      <div className="grid grid-2 about-content-grid">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="about-visual"
        >
          <div className="about-visual__image-container">
            <img
              src={withBase(aboutData.photo)}
              alt="Елена Курганова - Мастер ногтевого сервиса с 21-летним опытом работы"
              className="about-visual__image"
              loading="lazy"
              width="420"
              height="560"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="card card--highlight mb-4">
            <p>{aboutData.description}</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="mt-5"
      >
        <div className="card card--accent-gradient">
          <h3 className="card-title--light text-center mb-4">Почему выбирают меня</h3>
          <div className="why-choose-list">
            {aboutData.whyChoose.map((item, index) => (
              <motion.div
                key={index}
                className="why-choose-item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <span className="why-choose-item__bullet">•</span>
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
