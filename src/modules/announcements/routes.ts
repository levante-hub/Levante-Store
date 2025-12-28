import { Hono } from 'hono';
import type { AnnouncementCategory, AnnouncementResponse, AnnouncementsResponse, Language } from '@/modules/announcements/types';
import { supabaseAnnouncementService } from '@/modules/announcements/services/supabaseClient';

const announcements = new Hono();

// GET /announcements → Get latest announcement(s) by category/categories (required)
announcements.get('/announcements', async (c) => {
  try {
    const categoryParam = c.req.query('category');
    const languageParam = c.req.query('language');

    if (!categoryParam) {
      return c.json({ error: 'Category parameter is required' }, 400);
    }

    if (!languageParam) {
      return c.json({ error: 'Language parameter is required' }, 400);
    }

    const validCategories: AnnouncementCategory[] = ['announcement', 'privacy', 'landing', 'app'];
    const validLanguages: Language[] = ['es', 'en'];

    // Validate language
    if (!validLanguages.includes(languageParam as Language)) {
      return c.json({
        error: 'Invalid language',
        invalidLanguage: languageParam,
        validLanguages
      }, 400);
    }

    const language = languageParam as Language;

    // Split by comma to support multiple categories
    const categories = categoryParam
      .split(',')
      .map(cat => cat.trim() as AnnouncementCategory)
      .filter(cat => cat.length > 0);

    if (categories.length === 0) {
      return c.json({ error: 'At least one category is required' }, 400);
    }

    // Validate all categories
    const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
    if (invalidCategories.length > 0) {
      return c.json({
        error: 'Invalid categories',
        invalidCategories,
        validCategories
      }, 400);
    }

    c.header('Cache-Control', 'public, max-age=300');
    c.header('Content-Type', 'application/json');

    // Single category - return single announcement
    if (categories.length === 1) {
      const data = await supabaseAnnouncementService.getLatestAnnouncementByCategory(categories[0], language);
      const response: AnnouncementResponse = {
        announcement: data,
      };
      return c.json(response);
    }

    // Multiple categories - return array of announcements
    const data = await supabaseAnnouncementService.getLatestAnnouncementsByCategories(categories, language);
    const response: AnnouncementsResponse = {
      announcements: data,
      total: data.length,
    };
    return c.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ error: errorMessage }, 500);
  }
});

export default announcements;
