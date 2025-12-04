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

import './Cabinet.scss';

const Cabinet: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const cabinetPhotos = [
    { img: '/5298658092193091212.jpg', alt: 'Кабинет мастера' },
    { img: '/5427244503883969651.jpg', alt: 'Кабинет мастера' },
    { img: '/5427244503883969652.jpg', alt: 'Оборудование и стерилизация' },
    { img: '/5429213501576052044.jpg', alt: 'Продукция CND Shellac' },
    { img: '/5429471586160868689.jpg', alt: 'Рабочее место мастера' },
  ];

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="container cabinet-section">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h1 className="gradient-text">Мой кабинет</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="cabinet-slider-container"
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
          className="cabinet-swiper"
        >
          {cabinetPhotos.map((photo, index) => (
            <SwiperSlide key={index} className="cabinet-slide">
              {imageErrors[index] ? (
                <div className="cabinet-slide__error">
                  <span>Изображение не загружено</span>
                </div>
              ) : (
                <img
                  src={photo.img}
                  alt={photo.alt}
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

export default Cabinet;

