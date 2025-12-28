// Announcement category type matching Supabase enum
export type AnnouncementCategory = 'announcement' | 'privacy' | 'landing' | 'app';

// Supported languages
export type Language = 'es' | 'en';

// Raw announcement from Supabase (with localized fields)
export interface AnnouncementRaw {
  id: string;
  title_es: string;
  title_en: string;
  full_text_es: string;
  full_text_en: string;
  category: AnnouncementCategory;
  created_at: string;
}

// Announcement interface for API response (localized)
export interface Announcement {
  id: string;
  title: string;
  full_text: string;
  category: AnnouncementCategory;
  created_at: string;
}

// API Response format for single category
export interface AnnouncementResponse {
  announcement: Announcement | null;
}

// API Response format for multiple categories
export interface AnnouncementsResponse {
  announcements: Announcement[];
  total: number;
}
