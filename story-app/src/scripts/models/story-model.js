import {
  getStories as apiGetStories,
  addStory as apiAddStory,
} from '../data/api.js';
import { saveStory, deleteSavedStory, getSavedStory, getCachedStories } from '../db/idb.js';

export default class StoryModel {
  async getStories({ page = 1, size = 20, location = 1 } = {}) {
    try {
      const data = await apiGetStories({ page, size, location });
      const stories = data.listStory || [];
      return { stories, fromCache: false };
    } catch (err) {
      
      const cached = await getCachedStories();
      if (cached && cached.length > 0) {
        return { stories: cached, fromCache: true };
      }
      throw err;
    }
  }

  async addStory(formData) {
    return await apiAddStory(formData);
  }

  
  async saveStory(story) {
    return await saveStory(story);
  }

  
  async removeSavedStory(id) {
    return await deleteSavedStory(id);
  }

  
  async isSaved(id) {
    const story = await getSavedStory(id);
    return !!story;
  }
}
