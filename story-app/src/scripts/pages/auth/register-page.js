import { RegisterPresenter } from '../../presenters/auth-presenter.js';
import Swal from 'sweetalert2';

export default class RegisterPage {
  #presenter;

  async render() {
    return `
      <section class="auth-section container" aria-labelledby="register-heading">
        <div class="auth-card">
          <h1 id="register-heading">
            <i class="fa-solid fa-user-plus"></i> Daftar Akun
          </h1>
          <p class="auth-subtitle">Bergabung dan mulai berbagi cerita</p>

          <form id="register-form" novalidate>
            <div class="form-group">
              <label for="name">
                <i class="fa-solid fa-user"></i> Nama
              </label>
              <input type="text" id="name" name="name" required autocomplete="name"
                placeholder="Nama lengkap" aria-describedby="name-error" />
              <span id="name-error" class="field-error" role="alert"></span>
            </div>
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
              <input type="password" id="password" name="password" required autocomplete="new-password"
                placeholder="Minimal 8 karakter" minlength="8" aria-describedby="password-error" />
              <span id="password-error" class="field-error" role="alert"></span>
            </div>
            <button type="submit" class="btn btn-primary" id="submit-btn">
              <span class="btn-text"><i class="fa-solid fa-user-plus"></i> Daftar</span>
              <span class="btn-loading" hidden><i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...</span>
            </button>
          </form>

          <p class="auth-link">Sudah punya akun? <a href="#/login">Login di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter(this);
    const form = document.getElementById('register-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.#validate()) return;
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      await this.#presenter.register(name, email, password);
    });
  }

  #validate() {
    let valid = true;
    ['name-error', 'email-error', 'password-error'].forEach(id => {
      document.getElementById(id).textContent = '';
    });

    if (!document.getElementById('name').value.trim()) {
      document.getElementById('name-error').textContent = 'Nama tidak boleh kosong.';
      valid = false;
    }
    const email = document.getElementById('email');
    if (!email.value.trim() || !email.validity.valid) {
      document.getElementById('email-error').textContent = 'Email tidak valid.';
      valid = false;
    }
    if (document.getElementById('password').value.length < 8) {
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
      title: 'Registrasi Gagal',
      text: msg,
      confirmButtonColor: '#1a6fc4',
    });
  }

  onRegisterSuccess() {
    Swal.fire({
      icon: 'success',
      title: 'Akun Berhasil Dibuat!',
      text: 'Silakan login dengan akun barumu.',
      confirmButtonColor: '#1a6fc4',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      window.location.hash = '#/login';
    });
  }
}
