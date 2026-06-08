import React from 'react';
import { motion } from 'framer-motion';
import aboutData from '../data/about.json';
import './About.scss';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const scrollToBooking = () => {
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
};

const About: React.FC = () => {
  return (
    <>
      {/* ── HERO — первый экран ── */}
      <div className="about-hero">
        <div className="about-hero__canvas" aria-hidden="true">
          <div className="about-hero__blob about-hero__blob--sky" />
          <div className="about-hero__blob about-hero__blob--gold" />
          <div className="about-hero__blob about-hero__blob--coral" />
          <div className="about-hero__mesh" />
        </div>

        <div className="container about-hero__grid">
          <motion.div
            className="about-hero__copy"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="about-hero__title">
              <span className="about-hero__title-main">
                <span className="about-hero__title-line">Маникюр и</span>
                <span className="about-hero__title-line">педикюр</span>
              </span>
              <span className="about-hero__title-accent">мастер {aboutData.name}</span>
            </h1>

            <p className="about-hero__lead">
              Красота и здоровье ногтей, безопасные покрытия CND Shellac,
              сложные педикюры — в уютном кабинете на первом этаже
            </p>

            <div className="about-hero__actions">
              <motion.button
                type="button"
                className="btn btn-hero"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToBooking}
              >
                Записаться онлайн
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            className="about-hero__portrait"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="about-hero__frame">
              <div className="about-hero__frame-ring" aria-hidden="true" />
              <img
                src={withBase(aboutData.photo)}
                alt="Елена — мастер маникюра и педикюра в Железнодорожном"
                className="about-hero__photo"
                loading="eager"
                width="420"
                height="560"
              />
            </div>
            <p className="about-hero__caption">Елена Курганова</p>
            <p className="about-hero__caption-meta">
              Железнодорожный · Балашиха · 21 год мастерства
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Контент ниже hero ── */}
      <div className="container about-section">
        <div className="grid grid-2 about-content-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="about-quote card card--highlight"
          >
            <span className="about-quote__mark" aria-hidden="true">"</span>
            <p>{aboutData.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="about-tags"
          >
            {aboutData.qualities.map((item, i) => (
              <span key={i} className="about-tags__item">{item}</span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-5"
        >
          <div className="card card--accent-gradient about-why">
            <h3 className="card-title--light text-center mb-4">Почему выбирают меня</h3>
            <div className="why-choose-list">
              {aboutData.whyChoose.map((item, index) => (
                <motion.div
                  key={index}
                  className="why-choose-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * index }}
                  viewport={{ once: true }}
                >
                  <span className="why-choose-item__num">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default About;
