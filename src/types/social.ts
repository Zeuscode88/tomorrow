export type AvailabilityStatus = 'Disponible' | 'Ouvert aux collabs' | 'Occupé';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tech?: string;
  url?: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  role: string;
  country: string;
  headline: string;
  bio: string;
  skills: string[];
  portfolioItems: PortfolioItem[];
  githubUrl?: string;
  websiteUrl?: string;
  availability: AvailabilityStatus;
  updatedAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectionInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  fromUserCountry: string;
  toUserId: string;
  toUserName: string;
  toUserRole: string;
  toUserCountry: string;
  note?: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  createdAt: string;
}
