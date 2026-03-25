import { LoginPresenter } from '../../presenters/auth-presenter.js';
import Swal from 'sweetalert2';

export default class LoginPage {
  #presenter;

  async render() {
    return `
      <section class="auth-section container" aria-labelledby="login-heading">
        <div class="auth-card">
          <h1 id="login-heading">
            <i class="fa-solid fa-right-to-bracket"></i> Login
          </h1>
          <p class="auth-subtitle">Masuk untuk berbagi ceritamu</p>

          <form id="login-form" novalidate>
            <div class="form-group">
              <label for="email">
                <i class="fa-regular fa-envelope"></i> Email
              </label>
              <input type="email" id="email" name="email" required autocomplete="email"
                placeholder="contoh@email.com" aria-describedby="email-error" />
              <span id="email-error" class="field-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="password">
                <i class="fa-solid fa-lock"></i> Password
              </label>
              <input type="password" id="password" name="password" required autocomplete="current-password"
                placeholder="Minimal 8 karakter" minlength="8" aria-describedby="password-error" />
              <span id="password-error" class="field-error" role="alert"></span>
            </div>
            <button type="submit" class="btn btn-primary" id="submit-btn">
              <span class="btn-text"><i class="fa-solid fa-right-to-bracket"></i> Masuk</span>
              <span class="btn-loading" hidden><i class="fa-solid fa-spinner fa-spin"></i> Loading...</span>
            </button>
          </form>

          <p class="auth-link">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter(this);
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.#validate()) return;
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      await this.#presenter.login(email, password);
    });
  }

  #validate() {
    let valid = true;
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';

    if (!email.value.trim() || !email.validity.valid) {
      document.getElementById('email-error').textContent = 'Email tidak valid.';
      valid = false;
    }
    if (password.value.length < 8) {
      document.getElementById('password-error').textContent = 'Password minimal 8 karakter.';
      valid = false;
    }
    return valid;
  }

  showLoading() {
    document.querySelector('.btn-text').hidden = true;
    document.querySelector('.btn-loading').hidden = false;
    document.getElementById('submit-btn').disabled = true;
  }

  hideLoading() {
    document.querySelector('.btn-text').hidden = false;
    document.querySelector('.btn-loading').hidden = true;
    document.getElementById('submit-btn').disabled = false;
  }

  showError(msg) {
    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      text: msg,
      confirmButtonColor: '#1a6fc4',
    });
  }

  onLoginSuccess() {
    window.location.hash = '#/';
  }
}
