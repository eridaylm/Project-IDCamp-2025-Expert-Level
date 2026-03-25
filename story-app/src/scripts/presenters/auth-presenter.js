import AuthModel from '../models/auth-model.js';

const authModel = new AuthModel();

export class LoginPresenter {
  #view;
  #model;

  constructor(view) {
    this.#view = view;
    this.#model = authModel;
  }

  async login(email, password) {
    try {
      this.#view.showLoading();
      await this.#model.login({ email, password });
      this.#view.onLoginSuccess();
    } catch (err) {
      this.#view.showError(err.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}

export class RegisterPresenter {
  #view;
  #model;

  constructor(view) {
    this.#view = view;
    this.#model = authModel;
  }

  async register(name, email, password) {
    try {
      this.#view.showLoading();
      await this.#model.register({ name, email, password });
      this.#view.onRegisterSuccess();
    } catch (err) {
      this.#view.showError(err.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
