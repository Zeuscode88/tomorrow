import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Minimalist outline of the African continent (+ Madagascar)
 */
export const AfricaContinentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9.5 2.5C7.8 2.6 5.6 3.5 4.4 5.2C3.2 6.9 2.9 9.1 4.1 10.6C5.1 11.8 6.9 11.8 8.1 12.7C9.2 13.5 9.1 15.1 9.6 16.6C10.1 18.2 10.7 20.8 12.1 21.4C13.3 21.9 14.5 20.1 15.2 18.5C15.9 16.9 16.1 15.2 17.2 13.9C18.3 12.6 20.2 11.4 20.5 9.9C20.7 8.8 19.1 8.4 18.2 7.5C17.1 6.4 16.8 4.4 15.4 3.4C13.8 2.3 11.4 2.4 9.5 2.5Z" />
    <path d="M19.4 15.6C19.8 15.4 20.3 15.9 20.1 16.9C19.9 17.8 19.3 18.8 18.8 18.9C18.4 19 18.2 18.1 18.5 17.1C18.7 16.3 19.1 15.8 19.4 15.6Z" />
  </svg>
);

/**
 * Iconic African Baobab tree silhouette
 */
export const BaobabIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9.5 21V13.5C9.5 12.2 8.8 11 7.6 10.2" />
    <path d="M14.5 21V13.5C14.5 12.2 15.2 11 16.4 10.2" />
    <path d="M12 13.5V9.5" />
    <path d="M7.5 21H16.5" />
    <path d="M6.2 10.5C4.5 10.2 3.5 8.8 4 7.2C4.4 5.9 5.8 5.2 7.2 5.5C8 3.8 9.9 2.8 12 2.8C14.1 2.8 16 3.8 16.8 5.5C18.2 5.2 19.6 5.9 20 7.2C20.5 8.8 19.5 10.2 17.8 10.5" />
    <path d="M9.5 7.5L12 9.5L14.5 7.5" />
  </svg>
);

/**
 * West African Adinkra geometric motif (inspired by Akoma / Nyame Dua — innovation, wisdom & unity)
 */
export const AdinkraMotifIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="7" y="7" width="10" height="10" rx="1.5" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 2.5V5.5" />
    <path d="M12 18.5V21.5" />
    <path d="M2.5 12H5.5" />
    <path d="M18.5 12H21.5" />
  </svg>
);

/**
 * Traditional African Djembe drum icon
 */
export const DjembeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="12" cy="5.5" rx="6.5" ry="2.2" />
    <path d="M5.5 5.5C5.8 9.5 7.8 12.2 10.2 13.8V19.5C10.2 20.3 8.8 21 8.8 21H15.2C15.2 21 13.8 20.3 13.8 19.5V13.8C16.2 12.2 18.2 9.5 18.5 5.5" />
    <path d="M7.5 7.3L9.5 12.5" />
    <path d="M12 7.7V13.3" />
    <path d="M16.5 7.3L14.5 12.5" />
  </svg>
);

/**
 * African savanna rising sun & horizon icon
 */
export const AcaciaSunIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 16.5H21" />
    <path d="M7.5 16.5A4.5 4.5 0 0 1 16.5 16.5" />
    <path d="M12 5V8" />
    <path d="M6.2 7.8L8.3 9.9" />
    <path d="M17.8 7.8L15.7 9.9" />
    <path d="M6 19.8H18" />
  </svg>
);
