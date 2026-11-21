import React from 'react';
import {
  Stethoscope,
  GraduationCap,
  Coins,
  Truck,
  Scale,
  Layers,
} from 'lucide-react';
import { Sector } from '../types/app';
import {
  BaobabIcon,
  AcaciaSunIcon,
  DjembeIcon,
} from './africanIcons';

export function getSectorIcon(sector: Sector | string, className = 'w-4 h-4'): React.ReactNode {
  switch (sector) {
    case 'Agriculture & Alimentation':
      return <BaobabIcon className={className} />;
    case 'Santé & Urgence':
      return <Stethoscope className={className} />;
    case 'Éducation & Langues':
      return <GraduationCap className={className} />;
    case 'Inclusion Financière & Tontines':
      return <Coins className={className} />;
    case 'Énergie, Eau & Climat':
      return <AcaciaSunIcon className={className} />;
    case 'Mobilité & Logistique':
      return <Truck className={className} />;
    case 'Artisanat, Commerce & Tourisme':
      return <DjembeIcon className={className} />;
    case 'Citoyenneté & Droits':
      return <Scale className={className} />;
    default:
      return <Layers className={className} />;
  }
}
