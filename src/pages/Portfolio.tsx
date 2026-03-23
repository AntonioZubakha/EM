import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// @ts-expect-error - CSS imports don't have type definitions
import 'swiper/css';
// @ts-expect-error - CSS imports don't have type definitions
import 'swiper/css/navigation';
// @ts-expect-error - CSS imports don't have type definitions
import 'swiper/css/pagination';

import './Portfolio.scss';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const Portfolio: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const works = [
    { img: withBase('5298658092193091210.jpg'), alt: 'Пример работы — маникюр' },
    { img: withBase('5298658092193091224.jpg'), alt: 'Пример работы — маникюр' },
    { img: withBase('5298658092193091250.jpg'), alt: 'Пример работы — маникюр' },
    { img: withBase('5429213501576052045.jpg'), alt: 'Пример работы — маникюр' },
    { img: withBase('5298658092193091227.jpg'), alt: 'Пример работы — педикюр' },
  ];

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const openLightbox = (src: string) => setLightboxSrc(src);
  const closeLightbox = () => setLightboxSrc(null);

  return (
    <div className="container portfolio-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Мои работы</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        viewport={{ once: true }}
        className="portfolio-slider-container"
      >
        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          loop={true}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: false }}
          navigation={true}
          breakpoints={{
            640:  { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
          modules={[Navigation, Pagination, Autoplay]}
          className="portfolio-swiper"
        >
          {works.map((work, index) => (
            <SwiperSlide key={index} className="portfolio-slide">
              {imageErrors[index] ? (
                <div className="portfolio-slide__error">
                  <span>Изображение не загружено</span>
                </div>
              ) : (
                <img
                  src={work.img}
                  alt={work.alt}
                  loading="lazy"
                  onError={() => handleImageError(index)}
                  onClick={() => openLightbox(work.img)}
                  width="800"
                  height="600"
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            className="portfolio-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
          >
            <motion.img
              src={lightboxSrc}
              alt="Работа мастера"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            />
            <button className="portfolio-lightbox__close" onClick={closeLightbox} aria-label="Закрыть">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portfolio;
