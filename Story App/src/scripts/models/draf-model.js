import {
  saveDraft as idbSaveDraft,
  getAllDrafts as idbGetAllDrafts,
  deleteDraft as idbDeleteDraft,
  markDraftSynced as idbMarkSynced,
  getUnsyncedDrafts as idbGetUnsynced,
} from '../db/idb.js';
import { addStory } from '../data/api.js';

export default class DraftModel {
  async saveDraft(draft) {
    return await idbSaveDraft(draft);
  }

  async getAllDrafts() {
    return await idbGetAllDrafts();
  }

  async deleteDraft(id) {
    return await idbDeleteDraft(id);
  }

  async syncDraft(draft) {
    const formData = new FormData();
    formData.append('description', draft.description);
    if (draft.photoBlob) formData.append('photo', draft.photoBlob, 'draft-photo.jpg');
    if (draft.lat) formData.append('lat', draft.lat);
    if (draft.lon) formData.append('lon', draft.lon);

    await addStory(formData);
    await idbMarkSynced(draft.id);
  }

  async syncAllDrafts() {
    const unsynced = await idbGetUnsynced();
    const results = { success: 0, fail: 0 };

    for (const draft of unsynced) {
      try {
        await this.syncDraft(draft);
        results.success++;
      } catch {
        results.fail++;
      }
    }
    return results;
  }

  async getUnsyncedDrafts() {
    return await idbGetUnsynced();
  }

  searchDrafts(drafts, query) {
    if (!query) return drafts;
    const q = query.toLowerCase();
    return drafts.filter(d => d.description?.toLowerCase().includes(q));
  }

  sortDrafts(drafts, order) {
    const sorted = [...drafts];
    if (order === 'oldest') {
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (order === 'unsynced') {
      return sorted.filter(d => !d.synced);
    }
    return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
