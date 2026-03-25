import StoryModel from '../models/story-model.js';

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
      this.#view.onSubmitSuccess();
    } catch (err) {
      this.#view.showError(err.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
