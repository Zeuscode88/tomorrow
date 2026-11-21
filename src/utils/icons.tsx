import React from 'react';
import {
  Wheat,
  Droplets,
  HeartHandshake,
  ShieldCheck,
  Zap,
  Radio,
  BookOpen,
  Compass,
  Briefcase,
  Waves,
  Coins,
  Smartphone,
  Globe,
  Stethoscope,
  GraduationCap,
  Truck,
  Hammer,
  Scale,
  Cpu,
  Flame,
  Lightbulb,
} from 'lucide-react';
import {
  AfricaContinentIcon,
  BaobabIcon,
  AdinkraMotifIcon,
  DjembeIcon,
  AcaciaSunIcon,
} from './africanIcons';

export function getAppIcon(iconName: string, className = 'w-6 h-6'): React.ReactNode {
  switch (iconName) {
    case 'Africa':
      return <AfricaContinentIcon className={className} />;
    case 'Baobab':
    case 'Trees':
      return <BaobabIcon className={className} />;
    case 'Adinkra':
      return <AdinkraMotifIcon className={className} />;
    case 'Djembe':
      return <DjembeIcon className={className} />;
    case 'AcaciaSun':
    case 'Sun':
      return <AcaciaSunIcon className={className} />;
    case 'Wheat':
      return <Wheat className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Radio':
      return <Radio className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Waves':
      return <Waves className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Stethoscope':
      return <Stethoscope className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Hammer':
      return <Hammer className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    default:
      return <AfricaContinentIcon className={className} />;
  }
}
