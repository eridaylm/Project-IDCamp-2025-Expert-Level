import {
  getStories as apiGetStories,
  addStory as apiAddStory,
} from '../data/api.js';
import { cacheStories, getCachedStories } from '../db/idb.js';

export default class StoryModel {
  async getStories({ page = 1, size = 20, location = 1 } = {}) {
    try {
      const data = await apiGetStories({ page, size, location });
      const stories = data.listStory || [];

      
      if (stories.length > 0) {
        await cacheStories(stories).catch(() => {});
      }

      return { stories, fromCache: false };
    } catch (err) {
      
      const cached = await getCachedStories();
      if (cached && cached.length > 0) {
        return { stories: cached, fromCache: true };
      }
      throw err;
    }
  }

  /**
   * Kirim story baru ke API.
   */
  async addStory(formData) {
    return await apiAddStory(formData);
  }
}
