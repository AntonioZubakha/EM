import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import faqData from '../data/faq.json';
import './SeoFaq.scss';

const FAQ_SCHEMA_ID = 'faq-schema-ld';

const SeoFaq: React.FC = () => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    let script = document.getElementById(FAQ_SCHEMA_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = FAQ_SCHEMA_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      document.getElementById(FAQ_SCHEMA_ID)?.remove();
    };
  }, []);

  return (
    <section id="faq" className="seo-faq" aria-label="Частые вопросы">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <h2 className="gradient-text">Частые вопросы</h2>
          <p className="seo-faq__intro">
            Ответы о записи, адресе кабинета в Железнодорожном (Балашиха) и услугах маникюра и педикюра
          </p>
        </motion.div>

        <dl className="seo-faq__list">
          {faqData.map((item, index) => (
            <motion.div
              key={item.question}
              className="seo-faq__item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <dt className="seo-faq__question">{item.question}</dt>
              <dd className="seo-faq__answer">{item.answer}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default SeoFaq;
