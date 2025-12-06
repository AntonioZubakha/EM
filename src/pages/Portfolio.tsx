import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const works = [
    { img: withBase('5298658092193091210.jpg'), alt: 'Пример работы - маникюр' },
    { img: withBase('5298658092193091224.jpg'), alt: 'Пример работы - маникюр' },
    { img: withBase('5298658092193091250.jpg'), alt: 'Пример работы - маникюр' },
    { img: withBase('5429213501576052045.jpg'), alt: 'Пример работы - маникюр' },
    { img: withBase('5298658092193091227.jpg'), alt: 'Пример работы - педикюр' },
  ];

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

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
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="portfolio-slider-container"
      >
        <Swiper
          slidesPerView={1}
          spaceBetween={30}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 40,
            },
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
                  width="800"
                  height="600"
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </div>
  );
};

export default Portfolio;
