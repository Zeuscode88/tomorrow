export interface KeepChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface KeepNote {
  id: string;
  ownerId: string;
  title: string;
  body: string;
  isChecklist: boolean;
  checklistItems: KeepChecklistItem[];
  pinned: boolean;
  linkedAppId?: string;
  linkedAppTitle?: string;
  source: 'local' | 'takeout' | 'google_keep_api';
  updatedAt: string;
}

export interface PlatformSettings {
  announcementBanner: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  allowAIGeneration: boolean;
}
