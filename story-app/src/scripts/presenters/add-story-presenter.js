import StoryModel from '../models/story-model.js';
import { subscribePush, isSubscribed } from '../pwa/push-manager.js';

export default class AddStoryPresenter {
  #view;
  #model;

  constructor(view) {
    this.#view = view;
    this.#model = new StoryModel();
  }

  async submitStory(formData) {
    try {
      this.#view.showLoading();
      await this.#model.addStory(formData);

      
      await this.#sendPushNotification();

      this.#view.onSubmitSuccess();
    } catch (err) {
      this.#view.showError(err.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  async #sendPushNotification() {
    try {
      
      const subscribed = await isSubscribed();
      if (!subscribed) {
        await subscribePush();
      }
    } catch (err) {
      
      console.warn('[Push] Gagal mengirim notifikasi:', err.message);
    }
  }
}
