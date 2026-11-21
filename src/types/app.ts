export type Continent = 'Afrique';

export type Sector =
  | 'Agriculture & Alimentation'
  | 'Santé & Urgence'
  | 'Éducation & Langues'
  | 'Inclusion Financière & Tontines'
  | 'Énergie, Eau & Climat'
  | 'Mobilité & Logistique'
  | 'Artisanat, Commerce & Tourisme'
  | 'Citoyenneté & Droits';

export type AppDifficulty = 'Accessible' | 'Modéré' | 'Avancé';

export type AppStatus =
  | 'Idée IA du Jour'
  | 'Recherche Développeurs'
  | 'Prototypage en cours'
  | 'Incubé';

export interface DevPledge {
  id: string;
  name: string;
  role: string;
  country: string;
  githubOrContact?: string;
  comment: string;
  createdAt: string;
  userEmail?: string;
}

export interface AppComment {
  id: string;
  author: string;
  role: string;
  text: string;
  createdAt: string;
}

export interface DeveloperBrief {
  mvpScope: string[];
  localConstraints: string[]; // e.g. "Mode offline first", "Support USSD / SMS"
  monetization: string;
  openSourceFriendly: boolean;
  architecturalTip: string;
}

export interface AppIdea {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  continent: Continent;
  country: string;
  countryCode: string;
  flag: string;
  sector: Sector;
  targetAudience: string;
  problemSolved: string;
  impactPotential: string;
  techStackSuggested: string[];
  difficulty: AppDifficulty;
  status: AppStatus;
  votes: number;
  isDailyDrop?: boolean;
  dailyDropDate?: string;
  createdAt: string;
  authorEmail?: string;
  authorName?: string;
  devPledges: DevPledge[];
  comments: AppComment[];
  developerBrief: DeveloperBrief;
}

export interface GenerateRequestPayload {
  continent?: Continent;
  country?: string;
  sector?: Sector | 'Tous';
  focusTheme?: string;
}
