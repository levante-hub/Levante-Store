import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Announcement, AnnouncementCategory } from '@/modules/announcements/types';

class SupabaseAnnouncementService {
  private client: SupabaseClient | null = null;

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.client = createClient(supabaseUrl, supabaseServiceRoleKey);
    return this.client;
  }

  async getLatestAnnouncementByCategory(category: AnnouncementCategory): Promise<Announcement | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to fetch announcement: ${error.message}`);
    }

    return data;
  }

  async getLatestAnnouncementsByCategories(categories: AnnouncementCategory[]): Promise<Announcement[]> {
    const promises = categories.map(category =>
      this.getLatestAnnouncementByCategory(category)
    );

    const results = await Promise.all(promises);

    // Filter out null results
    return results.filter((announcement): announcement is Announcement => announcement !== null);
  }
}

export const supabaseAnnouncementService = new SupabaseAnnouncementService();
