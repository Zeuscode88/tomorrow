export type UserRole =
  | 'Développeur local'
  | 'Citoyen / Usager'
  | 'Entrepreneur / Porteur de projet'
  | 'Designer UI/UX'
  | 'Administrateur';

export const USER_ROLES: UserRole[] = [
  'Développeur local',
  'Citoyen / Usager',
  'Entrepreneur / Porteur de projet',
  'Designer UI/UX',
  'Administrateur',
];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  country?: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
