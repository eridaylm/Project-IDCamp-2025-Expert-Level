import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';
import { subscribePush, unsubscribePush, isSubscribed } from '../pwa/push-manager.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
      const isOpen = this.#navigationDrawer.classList.contains('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    await this.#updateNav();

    if (!document.startViewTransition) {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      return;
    }

    await document.startViewTransition(async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    });
  }

  async #updateNav() {
    const isLoggedIn = !!localStorage.getItem('token');
    const userName = localStorage.getItem('userName') || '';
    const navList = document.getElementById('nav-list');
    const pushSubscribed = await isSubscribed();

    navList.innerHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">Tentang</a></li>
      ${isLoggedIn
        ? `<li><a href="#/add">Tambah Cerita</a></li>
           <li><a href="#/drafts">Draft</a></li>
           <li>
             <button class="nav-btn" id="notif-toggle-btn" aria-pressed="${pushSubscribed}"
               aria-label="${pushSubscribed ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}">
               ${pushSubscribed ? '🔔 Notif On' : '🔕 Notif Off'}
             </button>
           </li>
           <li><button class="nav-btn" id="logout-btn">Logout (${userName})</button></li>`
        : `<li><a href="#/login">Login</a></li>
           <li><a href="#/register">Daftar</a></li>`
      }
    `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      window.location.hash = '#/login';
    });

    document.getElementById('notif-toggle-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        if (pushSubscribed) {
          await unsubscribePush();
          btn.textContent = '🔕 Notif Off';
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Aktifkan notifikasi');
        } else {
          await subscribePush();
          btn.textContent = '🔔 Notif On';
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Matikan notifikasi');
        }
      } catch (err) {
        alert('Gagal mengubah notifikasi: ' + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  }
}

export default App;
