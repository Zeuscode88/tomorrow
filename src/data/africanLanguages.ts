export interface AfricanLanguage {
  code: string;
  nativeName: string;
  frenchName: string;
  region: string;
  dir?: 'ltr' | 'rtl';
}

export const DEFAULT_LANGUAGE_CODE = 'fr';

export const AFRICAN_LANGUAGES: AfricanLanguage[] = [
  {
    code: 'fr',
    nativeName: 'Français',
    frenchName: 'Français',
    region: "Afrique de l'Ouest & Centrale, Maghreb",
    dir: 'ltr',
  },
  {
    code: 'en',
    nativeName: 'English',
    frenchName: 'Anglais',
    region: 'Nigeria, Kenya, Ghana, Afrique du Sud',
    dir: 'ltr',
  },
  {
    code: 'ar',
    nativeName: 'العربية',
    frenchName: 'Arabe',
    region: 'Maghreb, Égypte, Soudan, Mauritanie',
    dir: 'rtl',
  },
  {
    code: 'pt',
    nativeName: 'Português',
    frenchName: 'Portugais',
    region: 'Angola, Mozambique, Cap-Vert, Guinée-Bissau',
    dir: 'ltr',
  },
  {
    code: 'sw',
    nativeName: 'Kiswahili',
    frenchName: 'Swahili',
    region: 'Kenya, Tanzanie, Ouganda, RDC, Rwanda',
    dir: 'ltr',
  },
  {
    code: 'yo',
    nativeName: 'Èdè Yorùbá',
    frenchName: 'Yoruba',
    region: 'Nigeria, Bénin, Togo',
    dir: 'ltr',
  },
  {
    code: 'ha',
    nativeName: 'Hausa',
    frenchName: 'Haoussa',
    region: 'Nigeria, Niger, Ghana, Cameroun',
    dir: 'ltr',
  },
  {
    code: 'ig',
    nativeName: 'Asụsụ Igbo',
    frenchName: 'Igbo',
    region: 'Nigeria',
    dir: 'ltr',
  },
  {
    code: 'am',
    nativeName: 'አማርኛ',
    frenchName: 'Amharique',
    region: 'Éthiopie',
    dir: 'ltr',
  },
  {
    code: 'zu',
    nativeName: 'isiZulu',
    frenchName: 'Zoulou',
    region: 'Afrique du Sud',
    dir: 'ltr',
  },
  {
    code: 'om',
    nativeName: 'Afaan Oromoo',
    frenchName: 'Oromo',
    region: 'Éthiopie, Kenya',
    dir: 'ltr',
  },
  {
    code: 'ln',
    nativeName: 'Lingála',
    frenchName: 'Lingala',
    region: 'RDC, Congo',
    dir: 'ltr',
  },
  {
    code: 'bm',
    nativeName: 'Bamanankan',
    frenchName: 'Bambara',
    region: "Mali, Côte d'Ivoire, Burkina Faso",
    dir: 'ltr',
  },
  {
    code: 'wo',
    nativeName: 'Wolof',
    frenchName: 'Wolof',
    region: 'Sénégal, Gambie, Mauritanie',
    dir: 'ltr',
  },
  {
    code: 'sn',
    nativeName: 'ChiShona',
    frenchName: 'Shona',
    region: 'Zimbabwe',
    dir: 'ltr',
  },
  {
    code: 'so',
    nativeName: 'Soomaali',
    frenchName: 'Somali',
    region: 'Somalie, Djibouti, Éthiopie',
    dir: 'ltr',
  },
  {
    code: 'mg',
    nativeName: 'Malagasy',
    frenchName: 'Malgache',
    region: 'Madagascar',
    dir: 'ltr',
  },
  {
    code: 'es',
    nativeName: 'Español',
    frenchName: 'Espagnol',
    region: 'Guinée équatoriale',
    dir: 'ltr',
  },
];

export function getAfricanLanguageByCode(code: string): AfricanLanguage {
  return (
    AFRICAN_LANGUAGES.find((l) => l.code === code) ||
    AFRICAN_LANGUAGES[0]
  );
}
