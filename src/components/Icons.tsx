import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ManicureIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 3L15 8L21 9L16.5 12.5L17.5 19L12 16L6.5 19L7.5 12.5L3 9L9 8L12 3Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

export const PedicureIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 4C10 4 8.5 5.5 8.5 7.5C8.5 9.5 10 11 12 11C14 11 15.5 9.5 15.5 7.5C15.5 5.5 14 4 12 4Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 11V20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M7 18C7 19.5 8.5 21 10.5 21H13.5C15.5 21 17 19.5 17 18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChildrenIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
    <path d="M6 19C6 16 9 14 12 14C15 14 18 16 18 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10.5" cy="7.5" r="0.75" fill={color} />
    <circle cx="13.5" cy="7.5" r="0.75" fill={color} />
  </svg>
);

export const MenIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
    <path d="M6 20V18C6 16.5 8 15 12 15C16 15 18 16.5 18 18V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
    <path d="M12 8V12L15 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CardIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="7" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M3 11H21" stroke={color} strokeWidth="1.5" />
    <circle cx="7" cy="14.5" r="1" fill={color} />
    <circle cx="10" cy="14.5" r="1" fill={color} />
  </svg>
);

export const GiftIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="9" width="16" height="10" rx="1" stroke={color} strokeWidth="1.5" />
    <path d="M12 9V19" stroke={color} strokeWidth="1.5" />
    <path d="M7 9C7 7.5 8.5 6 12 6C15.5 6 17 7.5 17 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M8 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 11H21" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M17 15.5C14.5 15.5 12 16 9.5 17C8.5 15.5 7 14 5.5 13C6.5 10.5 7 8 7 5.5C7 4 8 3 9.5 3H14.5C16 3 17 4 17 5.5V15.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LocationIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 21C15 17 21 11 21 8.5C21 5 17 2 12 2C7 2 3 5 3 8.5C3 11 9 17 12 21Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 19V21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 5L6.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17.5 17.5L19 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 12H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19 12H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6.5 17.5L5 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19 5L17.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M10 9C10 7.343 11.343 6 13 6C14.657 6 16 7.343 16 9C16 10.657 14.657 12 13 12V15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SuccessIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill={color} />
    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);