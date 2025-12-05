import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'info' | 'success' | 'warning';
  buttonText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Понятно'
}) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✓';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'error':
        return 'Ошибка';
      case 'warning':
        return 'Внимание';
      case 'success':
        return 'Успешно';
      default:
        return 'Информация';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`modal modal--${type}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__icon">{getIcon()}</div>
            <h3 className="modal__title">{getTitle()}</h3>
            <p className="modal__message">{message}</p>
            <motion.button
              className={`btn btn-primary modal__button`}
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {buttonText}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

