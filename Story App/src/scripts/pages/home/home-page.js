import HomePresenter from '../../presenters/home-presenter.js';
import { showFormattedDate } from '../../utils/index.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default class HomePage {
  #presenter;
  #map;
  #markers = [];
  #stories = [];

  async render() {
    return `
      <section aria-labelledby="stories-heading">
        <div class="container">
          <div class="home-header">
            <h1 id="stories-heading">Cerita Terbaru</h1>
            <a href="#/add" class="btn btn-primary" aria-label="Tambah cerita baru">+ Tambah Cerita</a>
          </div>

          <div id="stories-alert" class="alert" role="alert" aria-live="polite" hidden></div>

          <div id="loading-indicator" class="loading-indicator" aria-live="polite" hidden>
            <div class="spinner" aria-hidden="true"></div>
            <p>Memuat cerita...</p>
          </div>

          <div id="stories-map" class="stories-map" aria-label="Peta lokasi cerita" role="region"></div>

          <div id="stories-list" class="stories-list" role="list" aria-label="Daftar cerita"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter(this);
    this.#initMap();
    await this.#presenter.loadStories();
  }

  #initMap() {
    this.#map = L.map('stories-map', { zoomControl: true }).setView([-2.5, 118], 5);
    setTimeout(() => this.#map.invalidateSize(), 100);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
    });

    const sateliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri',
        maxZoom: 18,
      }
    );

    osmLayer.addTo(this.#map);

    const baseLayers = {
      'OpenStreetMap': osmLayer,
      'Topografi': topoLayer,
      'Satelit': sateliteLayer,
    };

    L.control.layers(baseLayers).addTo(this.#map);
  }

  showLoading() {
    document.getElementById('loading-indicator').hidden = false;
  }

  hideLoading() {
    document.getElementById('loading-indicator').hidden = true;
  }

  showError(msg) {
    const alertEl = document.getElementById('stories-alert');
    if (msg === 'Unauthorized') {
      alertEl.textContent = 'Sesi habis. Silakan login kembali.';
      alertEl.className = 'alert alert-error';
      alertEl.hidden = false;
      localStorage.removeItem('token');
      setTimeout(() => { window.location.hash = '#/login'; }, 2000);
      return;
    }
    alertEl.textContent = `Gagal memuat cerita: ${msg}`;
    alertEl.className = 'alert alert-error';
    alertEl.hidden = false;
  }

  showStories(stories, fromCache = false) {
    this.#stories = stories;
    const list = document.getElementById('stories-list');

    if (fromCache) {
      const alertEl = document.getElementById('stories-alert');
      alertEl.textContent = 'Mode offline — menampilkan data tersimpan.';
      alertEl.className = 'alert alert-success';
      alertEl.hidden = false;
    }

    if (!stories.length) {
      list.innerHTML = '<p class="empty-state">Belum ada cerita. <a href="#/add">Tambahkan yang pertama!</a></p>';
      return;
    }

    list.innerHTML = stories.map((story, idx) => `
      <article class="story-card" role="listitem" data-id="${story.id}" data-index="${idx}"
        tabindex="0" aria-label="Cerita oleh ${story.name}">
        <img src="${story.photoUrl}" alt="Foto cerita dari ${story.name}" 
          class="story-image" loading="lazy" />
        <div class="story-content">
          <h2 class="story-author">${story.name}</h2>
          <p class="story-desc">${story.description}</p>
          <time class="story-date" datetime="${story.createdAt}">
            ${showFormattedDate(story.createdAt, 'id-ID')}
          </time>
          ${story.lat && story.lon 
            ? `<span class="story-location" aria-label="Lokasi tersedia">📍 Lihat di peta</span>` 
            : ''}
        </div>
      </article>
    `).join('');

    this.#clearMarkers();
    const validStories = stories.filter(s => s.lat && s.lon);
    
    validStories.forEach((story, idx) => {
      const marker = L.marker([story.lat, story.lon])
        .addTo(this.#map)
        .bindPopup(`
          <div class="popup-content">
            <img src="${story.photoUrl}" alt="Foto cerita ${story.name}" style="width:100%;border-radius:4px;margin-bottom:8px;" />
            <strong>${story.name}</strong>
            <p style="margin:4px 0;font-size:0.85rem;">${story.description.slice(0, 80)}${story.description.length > 80 ? '...' : ''}</p>
            <small>${showFormattedDate(story.createdAt, 'id-ID')}</small>
          </div>
        `);
      this.#markers.push(marker);
    });

    if (validStories.length > 0) {
      const group = L.featureGroup(this.#markers);
      this.#map.fitBounds(group.getBounds().pad(0.2));
    }

    list.querySelectorAll('.story-card').forEach((card) => {
      const onClick = () => {
        const idx = parseInt(card.dataset.index);
        const story = this.#stories[idx];
        if (story.lat && story.lon) {
          this.#map.setView([story.lat, story.lon], 13, { animate: true });
          const markerIdx = validStories.findIndex(s => s.id === story.id);
          if (markerIdx >= 0) this.#markers[markerIdx].openPopup();
        }
        list.querySelectorAll('.story-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      };

      card.addEventListener('click', onClick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      });
    });
  }

  #clearMarkers() {
    this.#markers.forEach(m => m.remove());
    this.#markers = [];
  }
}