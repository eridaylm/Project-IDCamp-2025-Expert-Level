import DraftModel from '../../models/draf-model.js';
import { showFormattedDate } from '../../utils/index.js';
import Swal from 'sweetalert2';

export default class DraftsPage {
  #model;
  #drafts = [];
  #sortOrder = 'newest';
  #searchQuery = '';

  constructor() {
    this.#model = new DraftModel();
  }

  async render() {
    return `
      <section class="container drafts-section" aria-labelledby="drafts-heading">
        <div class="drafts-header">
          <div>
            <h1 id="drafts-heading">
              <i class="fa-solid fa-book-open"></i> Draft Cerita
            </h1>
            <p class="drafts-subtitle">Cerita yang disimpan saat offline</p>
          </div>
          <div class="drafts-actions">
            <button id="sync-all-btn" class="btn btn-primary" aria-label="Sinkronkan semua draft">
              <i class="fa-solid fa-cloud-arrow-up"></i> Sync Semua
            </button>
            <a href="#/add" class="btn btn-secondary">
              <i class="fa-solid fa-plus"></i> Buat Draft Baru
            </a>
          </div>
        </div>

        <div class="drafts-toolbar">
          <div class="search-wrapper">
            <label for="draft-search" class="visually-hidden">Cari draft</label>
            <input type="search" id="draft-search" placeholder="Cari draft..."
              aria-label="Cari draft berdasarkan deskripsi" />
          </div>
          <div class="sort-wrapper">
            <label for="draft-sort" class="visually-hidden">Urutkan</label>
            <select id="draft-sort" aria-label="Urutkan draft">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="unsynced">Belum Tersync</option>
            </select>
          </div>
        </div>

        <div id="drafts-loading" class="loading-indicator" aria-live="polite" hidden>
          <div class="spinner" aria-hidden="true"></div>
          <p>Memuat draft...</p>
        </div>

        <div id="drafts-list" class="drafts-list" role="list" aria-label="Daftar draft cerita"></div>
      </section>
    `;
  }

  async afterRender() {
    await this.#loadDrafts();
    this.#initSearch();
    this.#initSort();
    this.#initSyncAll();
  }

  async #loadDrafts() {
    document.getElementById('drafts-loading').hidden = false;
    try {
      this.#drafts = await this.#model.getAllDrafts();
      this.#renderDrafts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Memuat', text: err.message, confirmButtonColor: '#1a6fc4' });
    } finally {
      document.getElementById('drafts-loading').hidden = true;
    }
  }

  #renderDrafts() {
    const list = document.getElementById('drafts-list');
    let filtered = this.#model.searchDrafts(this.#drafts, this.#searchQuery);
    filtered = this.#model.sortDrafts(filtered, this.#sortOrder);

    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:12px;display:block"></i>
          <p>${this.#searchQuery ? 'Tidak ada draft yang cocok.' : 'Belum ada draft tersimpan.'}</p>
          ${!this.#searchQuery ? '<a href="#/add" class="btn btn-primary" style="margin-top:16px"><i class="fa-solid fa-plus"></i> Buat Cerita Baru</a>' : ''}
        </div>`;
      return;
    }

    list.innerHTML = filtered.map((draft) => `
      <article class="draft-card ${draft.synced ? 'synced' : 'unsynced'}" role="listitem" data-id="${draft.id}">
        <div class="draft-status">
          <span class="status-badge ${draft.synced ? 'badge-synced' : 'badge-unsynced'}">
            <i class="fa-solid ${draft.synced ? 'fa-circle-check' : 'fa-clock'}"></i>
            ${draft.synced ? 'Tersync' : 'Belum Sync'}
          </span>
          <time class="draft-date" datetime="${draft.createdAt}">
            <i class="fa-regular fa-calendar"></i>
            ${showFormattedDate(draft.createdAt, 'id-ID')}
          </time>
        </div>
        <p class="draft-desc">${draft.description || '(Tanpa deskripsi)'}</p>
        ${draft.lat && draft.lon
          ? `<p class="draft-location"><i class="fa-solid fa-location-dot"></i> ${parseFloat(draft.lat).toFixed(4)}, ${parseFloat(draft.lon).toFixed(4)}</p>`
          : '<p class="draft-location draft-no-loc"><i class="fa-solid fa-location-dot"></i> Tanpa lokasi</p>'}
        <div class="draft-card-actions">
          ${!draft.synced ? `
            <button class="btn btn-primary btn-sm sync-btn" data-id="${draft.id}" aria-label="Sync draft ini">
              <i class="fa-solid fa-cloud-arrow-up"></i> Sync
            </button>` : ''}
          <button class="btn btn-danger btn-sm delete-btn" data-id="${draft.id}" aria-label="Hapus draft ini">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </div>
      </article>
    `).join('');

    list.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.#confirmDelete(Number(btn.dataset.id)));
    });
    list.querySelectorAll('.sync-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.#syncOneDraft(Number(btn.dataset.id)));
    });
  }

  async #confirmDelete(id) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Draft?',
      text: 'Draft yang dihapus tidak bisa dikembalikan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e03e3e',
      cancelButtonColor: '#1a6fc4',
    });
    if (!result.isConfirmed) return;
    try {
      await this.#model.deleteDraft(id);
      this.#drafts = this.#drafts.filter(d => d.id !== id);
      this.#renderDrafts();
      Swal.fire({ icon: 'success', title: 'Dihapus!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, confirmButtonColor: '#1a6fc4' });
    }
  }

  async #syncOneDraft(id) {
    const draft = this.#drafts.find(d => d.id === id);
    if (!draft) return;
    const btn = document.querySelector(`.sync-btn[data-id="${id}"]`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; }
    try {
      await this.#model.syncDraft(draft);
      const idx = this.#drafts.findIndex(d => d.id === id);
      if (idx >= 0) this.#drafts[idx].synced = true;
      this.#renderDrafts();
      Swal.fire({ icon: 'success', title: 'Tersync!', text: 'Draft berhasil dikirim ke server.', timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Sync', text: err.message, confirmButtonColor: '#1a6fc4' });
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync'; }
    }
  }

  async #syncAllDrafts() {
    const unsynced = await this.#model.getUnsyncedDrafts();
    if (!unsynced.length) {
      Swal.fire({ icon: 'info', title: 'Semua Sudah Sync', text: 'Tidak ada draft yang perlu dikirim.', confirmButtonColor: '#1a6fc4' });
      return;
    }
    const btn = document.getElementById('sync-all-btn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengirim ${unsynced.length} draft...`;
    const results = await this.#model.syncAllDrafts();
    await this.#loadDrafts();
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync Semua';
    if (results.fail === 0) {
      Swal.fire({ icon: 'success', title: 'Semua Tersync!', text: `${results.success} draft berhasil dikirim.`, timer: 2000, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'warning', title: 'Sebagian Berhasil', text: `${results.success} berhasil, ${results.fail} gagal.`, confirmButtonColor: '#1a6fc4' });
    }
  }

  #initSearch() {
    const input = document.getElementById('draft-search');
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { this.#searchQuery = input.value.trim(); this.#renderDrafts(); }, 300);
    });
  }

  #initSort() {
    document.getElementById('draft-sort').addEventListener('change', (e) => {
      this.#sortOrder = e.target.value;
      this.#renderDrafts();
    });
  }

  #initSyncAll() {
    document.getElementById('sync-all-btn').addEventListener('click', () => this.#syncAllDrafts());
  }
}
