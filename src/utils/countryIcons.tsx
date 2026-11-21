import React from 'react';

interface CountryBadgeProps {
  countryCode?: string;
  countryName: string;
  className?: string;
}

// Crisp SVG mini-flags for African countries
export const CountryFlagIcon: React.FC<{ code: string; className?: string }> = ({
  code,
  className = 'w-4 h-3',
}) => {
  const c = (code || '').toUpperCase().trim();

  switch (c) {
    case 'SN': // Senegal: Green, Yellow with green star, Red
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#00853F" />
          <rect x="10" width="10" height="20" fill="#FDEF42" />
          <rect x="20" width="10" height="20" fill="#E31B23" />
          <polygon
            points="15,6 16.2,9.8 20,9.8 17,12.2 18.2,16 15,13.6 11.8,16 13,12.2 10,9.8 13.8,9.8"
            fill="#00853F"
          />
        </svg>
      );
    case 'CI': // Cote d'Ivoire: Orange, White, Green
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#F77F00" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#009E60" />
        </svg>
      );
    case 'ML': // Mali: Green, Yellow, Red
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#14B53A" />
          <rect x="10" width="10" height="20" fill="#FCD116" />
          <rect x="20" width="10" height="20" fill="#CE1126" />
        </svg>
      );
    case 'GN': // Guinea: Red, Yellow, Green
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#CE1126" />
          <rect x="10" width="10" height="20" fill="#FCD116" />
          <rect x="20" width="10" height="20" fill="#009460" />
        </svg>
      );
    case 'NG': // Nigeria: Green, White, Green
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#008751" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#008751" />
        </svg>
      );
    case 'KE': // Kenya
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="6" fill="#000000" />
          <rect y="6" width="30" height="8" fill="#BB0000" />
          <rect y="14" width="30" height="6" fill="#006600" />
          <circle cx="15" cy="10" r="3" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="2" fill="#BB0000" />
        </svg>
      );
    case 'MA': // Morocco: Red with green star
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="20" fill="#C1272D" />
          <polygon
            points="15,6 16.2,9.8 20,9.8 17,12.2 18.2,16 15,13.6 11.8,16 13,12.2 10,9.8 13.8,9.8"
            fill="none"
            stroke="#006233"
            strokeWidth="0.8"
          />
        </svg>
      );
    case 'DZ': // Algeria: Green, White, Red crescent/star
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="15" height="20" fill="#006233" />
          <rect x="15" width="15" height="20" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="4" fill="#D21034" />
          <circle cx="16.2" cy="10" r="3.1" fill="#FFFFFF" />
        </svg>
      );
    case 'TN': // Tunisia: Red with white circle
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="20" fill="#E70013" />
          <circle cx="15" cy="10" r="4.5" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="2.8" fill="#E70013" />
          <circle cx="16" cy="10" r="2.2" fill="#FFFFFF" />
        </svg>
      );
    case 'CM': // Cameroon: Green, Red with yellow star, Yellow
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#007A5E" />
          <rect x="10" width="10" height="20" fill="#CE1126" />
          <rect x="20" width="10" height="20" fill="#FCD116" />
          <polygon
            points="15,7 16,9.5 19,9.5 16.5,11.5 17.5,14 15,12.5 12.5,14 13.5,11.5 11,9.5 14,9.5"
            fill="#FCD116"
          />
        </svg>
      );
    case 'CD': // DRC: Sky blue with diagonal yellow/red stripe and star
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="20" fill="#007FFF" />
          <path d="M0,16 L24,0 L30,0 L30,4 L6,20 L0,20 Z" fill="#F7D618" />
          <path d="M0,17.5 L26,0 L30,0 L30,2.5 L4,20 L0,20 Z" fill="#CE1021" />
          <polygon points="5,3 5.8,5.4 8.2,5.4 6.2,6.8 7,9.2 5,7.8 3,9.2 3.8,6.8 1.8,5.4 4.2,5.4" fill="#F7D618" />
        </svg>
      );
    case 'MG': // Madagascar: White left, Red top-right, Green bottom-right
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="10" height="20" fill="#FFFFFF" />
          <rect x="10" width="20" height="10" fill="#FC3D32" />
          <rect x="10" y="10" width="20" height="10" fill="#007E3A" />
        </svg>
      );
    case 'GH': // Ghana: Red, Yellow with black star, Green
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="6.6" fill="#CF0921" />
          <rect y="6.6" width="30" height="6.8" fill="#FCD116" />
          <rect y="13.4" width="30" height="6.6" fill="#006B3F" />
          <polygon points="15,7.4 15.8,9.6 18,9.6 16.2,10.9 16.9,13 15,11.7 13.1,13 13.8,10.9 12,9.6 14.2,9.6" fill="#000000" />
        </svg>
      );
    case 'RW': // Rwanda: Sky blue, Yellow, Green
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="10" fill="#00A1DE" />
          <rect y="10" width="30" height="5" fill="#FAD201" />
          <rect y="15" width="30" height="5" fill="#20603D" />
          <circle cx="24" cy="4.5" r="2.2" fill="#E5BE01" />
        </svg>
      );
    case 'BF': // Burkina Faso: Red, Green with yellow star
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="10" fill="#EF2B2D" />
          <rect y="10" width="30" height="10" fill="#009E49" />
          <polygon points="15,7 15.9,9.4 18.4,9.4 16.4,10.8 17.1,13.2 15,11.8 12.9,13.2 13.6,10.8 11.6,9.4 14.1,9.4" fill="#FCD116" />
        </svg>
      );
    case 'BJ': // Benin: Green left, Yellow top-right, Red bottom-right
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="11" height="20" fill="#008751" />
          <rect x="11" width="19" height="10" fill="#FCD116" />
          <rect x="11" y="10" width="19" height="10" fill="#E8112D" />
        </svg>
      );
    case 'TG': // Togo: Green/Yellow stripes with red canton
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="20" fill="#006A4E" />
          <rect y="4" width="30" height="4" fill="#FFCE00" />
          <rect y="12" width="30" height="4" fill="#FFCE00" />
          <rect width="12" height="12" fill="#D21034" />
        </svg>
      );
    case 'ET': // Ethiopia: Green, Yellow, Red
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="6.6" fill="#078930" />
          <rect y="6.6" width="30" height="6.8" fill="#FCDD09" />
          <rect y="13.4" width="30" height="6.6" fill="#DA121A" />
          <circle cx="15" cy="10" r="3" fill="#0F47AF" />
        </svg>
      );
    case 'ZA': // South Africa
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="10" fill="#E03C31" />
          <rect y="10" width="30" height="10" fill="#001489" />
          <path d="M0,0 L12,10 L0,20 Z" fill="#000000" />
          <path d="M0,7 L11,10 L0,13 Z" fill="#FFB81C" />
          <rect x="10" y="8" width="20" height="4" fill="#007749" />
        </svg>
      );
    case 'EG': // Egypt: Red, White, Black
      return (
        <svg viewBox="0 0 30 20" className={`inline-block rounded-xs shadow-xs ${className}`}>
          <rect width="30" height="6.6" fill="#CE1126" />
          <rect y="6.6" width="30" height="6.8" fill="#FFFFFF" />
          <rect y="13.4" width="30" height="6.6" fill="#000000" />
          <circle cx="15" cy="10" r="1.8" fill="#C09300" />
        </svg>
      );
    default:
      return (
        <span className="inline-flex items-center justify-center w-5 h-3.5 bg-slate-100 border border-slate-300 rounded-xs text-[9px] font-mono font-bold text-slate-700">
          {c.slice(0, 2) || 'AF'}
        </span>
      );
  }
};

export const CountryBadge: React.FC<CountryBadgeProps> = ({
  countryCode,
  countryName,
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-700 ${className}`}>
      <CountryFlagIcon code={countryCode || countryName.slice(0, 2)} />
      <span className="font-semibold text-slate-900">{countryName}</span>
    </span>
  );
};
