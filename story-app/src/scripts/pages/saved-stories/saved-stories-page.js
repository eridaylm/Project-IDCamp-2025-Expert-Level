import { getCachedStories, deleteSavedStory } from '../../db/idb.js';
import { showFormattedDate } from '../../utils/index.js';
import Swal from 'sweetalert2';

export default class SavedStoriesPage {
  #stories = [];

  async render() {
    return `
      <section class="container saved-stories-section" aria-labelledby="saved-heading">
        <div class="saved-header">
          <div>
            <h1 id="saved-heading">
              <i class="fa-solid fa-bookmark"></i> Story Tersimpan
            </h1>
            <p class="saved-subtitle">Story yang kamu simpan dari IndexedDB</p>
          </div>
          <a href="#/" class="btn btn-secondary" aria-label="Kembali ke beranda">
            <i class="fa-solid fa-arrow-left"></i> Beranda
          </a>
        </div>

        <div class="saved-toolbar">
          <div class="search-wrapper">
            <label for="saved-search" class="visually-hidden">Cari story tersimpan</label>
            <input
              type="search"
              id="saved-search"
              placeholder="Cari cerita tersimpan..."
              aria-label="Cari story berdasarkan nama atau deskripsi"
            />
          </div>
        </div>

        <div id="saved-loading" class="loading-indicator" aria-live="polite" hidden>
          <div class="spinner" aria-hidden="true"></div>
          <p>Memuat story tersimpan...</p>
        </div>

        <div id="saved-count" class="saved-count" aria-live="polite"></div>

        <div
          id="saved-list"
          class="saved-stories-list"
          role="list"
          aria-label="Daftar story tersimpan"
        ></div>
      </section>
    `;
  }

  async afterRender() {
    await this.#loadSavedStories();
    this.#initSearch();
  }

  async #loadSavedStories() {
    document.getElementById('saved-loading').hidden = false;
    try {
      this.#stories = await getCachedStories();
      this.#renderList(this.#stories);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat',
        text: err.message,
        confirmButtonColor: '#1a6fc4',
      });
    } finally {
      document.getElementById('saved-loading').hidden = true;
    }
  }

  #renderList(stories) {
    const list = document.getElementById('saved-list');
    const countEl = document.getElementById('saved-count');

    countEl.textContent = stories.length
      ? `${stories.length} story tersimpan`
      : '';

    if (!stories.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bookmark" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:12px;display:block"></i>
          <p>Belum ada story yang disimpan.</p>
          <a href="#/" class="btn btn-primary" style="margin-top:16px">
            <i class="fa-solid fa-house"></i> Ke Beranda & Simpan Story
          </a>
        </div>`;
      return;
    }

    list.innerHTML = stories.map((story) => `
      <article class="saved-card" role="listitem" data-id="${story.id}">
        <div class="saved-card-img-wrap">
          <img
            src="${story.photoUrl}"
            alt="Foto cerita dari ${story.name}"
            class="saved-card-img"
            loading="lazy"
          />
        </div>
        <div class="saved-card-body">
          <div class="saved-card-meta">
            <h2 class="saved-card-author">${story.name}</h2>
            <time class="saved-card-date" datetime="${story.createdAt}">
              <i class="fa-regular fa-calendar"></i>
              ${showFormattedDate(story.createdAt, 'id-ID')}
            </time>
          </div>
          <p class="saved-card-desc">${story.description}</p>
          ${story.lat && story.lon
            ? `<p class="saved-card-location">
                <i class="fa-solid fa-location-dot"></i>
                ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}
               </p>`
            : '<p class="saved-card-location no-loc"><i class="fa-solid fa-location-dot"></i> Tanpa lokasi</p>'
          }
          ${story.savedAt
            ? `<p class="saved-card-saved-at">
                <i class="fa-solid fa-floppy-disk"></i>
                Disimpan: ${showFormattedDate(story.savedAt, 'id-ID')}
               </p>`
            : ''
          }
        </div>
        <div class="saved-card-actions">
          <button
            class="btn btn-danger btn-sm delete-saved-btn"
            data-id="${story.id}"
            aria-label="Hapus story ${story.name} dari tersimpan"
          >
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </div>
      </article>
    `).join('');

    list.querySelectorAll('.delete-saved-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.#confirmDelete(btn.dataset.id));
    });
  }

  async #confirmDelete(id) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Story Tersimpan?',
      text: 'Story ini akan dihapus dari IndexedDB.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e03e3e',
      cancelButtonColor: '#1a6fc4',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteSavedStory(id);
      this.#stories = this.#stories.filter((s) => s.id !== id);
      this.#renderList(this.#stories);
      Swal.fire({
        icon: 'success',
        title: 'Dihapus!',
        text: 'Story berhasil dihapus dari penyimpanan.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.message,
        confirmButtonColor: '#1a6fc4',
      });
    }
  }

  #initSearch() {
    const input = document.getElementById('saved-search');
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const q = input.value.trim().toLowerCase();
        if (!q) {
          this.#renderList(this.#stories);
          return;
        }
        const filtered = this.#stories.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q)
        );
        this.#renderList(filtered);
      }, 300);
    });
  }
}
