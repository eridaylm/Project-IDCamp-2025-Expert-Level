import StoryModel from '../models/story-model.js';

export default class HomePresenter {
  #view;
  #model;

  constructor(view) {
    this.#view = view;
    this.#model = new StoryModel();
  }

  async loadStories() {
    try {
      this.#view.showLoading();
      const { stories, fromCache } = await this.#model.getStories({ location: 1 });
      this.#view.showStories(stories, fromCache);
    } catch (err) {
      this.#view.showError(err.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
