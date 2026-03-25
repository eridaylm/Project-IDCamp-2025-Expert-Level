import AddStoryPresenter from '../../presenters/add-story-presenter.js';
import { saveDraft } from '../../db/idb.js';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export default class AddStoryPage {
  #presenter;
  #map;
  #marker;
  #selectedLat = null;
  #selectedLon = null;
  #mediaStream = null;
  #capturedBlob = null;

  async render() {
    return `
      <section class="container add-story-section" aria-labelledby="add-story-heading">
        <h1 id="add-story-heading"><i class="fa-solid fa-pen-to-square"></i> Tambah Cerita Baru</h1>
        <div id="add-alert" class="alert" role="alert" aria-live="polite" hidden></div>

        <form id="add-story-form" novalidate>

          <!-- Deskripsi -->
          <div class="form-group">
            <label for="description">Deskripsi Cerita <span aria-hidden="true">*</span></label>
            <textarea id="description" name="description" rows="4" required
              placeholder="Ceritakan pengalamanmu..."
              aria-describedby="description-error"></textarea>
            <span id="description-error" class="field-error" role="alert"></span>
          </div>

          <!-- Foto -->
          <div class="form-group">
            <fieldset class="photo-fieldset">
              <legend>Foto <span aria-hidden="true">*</span></legend>
              <div class="photo-tabs" role="tablist">
                <button type="button" class="tab-btn active" role="tab" aria-selected="true"
                  id="tab-upload" aria-controls="panel-upload">Upload File</button>
                <button type="button" class="tab-btn" role="tab" aria-selected="false"
                  id="tab-camera" aria-controls="panel-camera">Gunakan Kamera</button>
              </div>

              <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload">
                <label for="photo-file" class="visually-hidden">Pilih foto dari perangkat</label>
                <input type="file" id="photo-file" name="photo" accept="image/*"
                  aria-describedby="photo-error" />
                <div id="photo-preview-upload" class="photo-preview" hidden>
                  <img id="preview-img-upload" src="" alt="Preview foto yang dipilih" />
                </div>
              </div>

              <div id="panel-camera" role="tabpanel" aria-labelledby="tab-camera" hidden>
                <div class="camera-controls">
                  <button type="button" id="start-camera-btn" class="btn btn-secondary">
                    Aktifkan Kamera
                  </button>
                  <button type="button" id="capture-btn" class="btn btn-secondary" disabled>
                    Ambil Foto
                  </button>
                  <button type="button" id="stop-camera-btn" class="btn btn-secondary" disabled>
                    Matikan Kamera
                  </button>
                </div>
                <video id="camera-video" class="camera-video" autoplay playsinline
                  aria-label="Live preview kamera" hidden></video>
                <canvas id="camera-canvas" hidden></canvas>
                <div id="photo-preview-camera" class="photo-preview" hidden>
                  <img id="preview-img-camera" src="" alt="Foto yang diambil dari kamera" />
                </div>
              </div>
            </fieldset>
            <span id="photo-error" class="field-error" role="alert"></span>
          </div>

          <!-- Peta -->
          <div class="form-group">
            <label>Lokasi (Klik pada peta untuk memilih)</label>
            <div id="add-map" class="add-story-map" aria-label="Peta pemilihan lokasi" role="region"></div>
            <p id="location-info" class="location-info" aria-live="polite">Belum ada lokasi dipilih</p>
          </div>

          <div class="form-submit-group">
            <button type="submit" class="btn btn-primary" id="submit-btn">
              <span class="btn-text">Kirim Cerita</span>
              <span class="btn-loading" hidden>Mengirim...</span>
            </button>
            <button type="button" class="btn btn-secondary" id="save-draft-btn">
              💾 Simpan sebagai Draft
            </button>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AddStoryPresenter(this);
    this.#initMap();
    this.#initPhotoTabs();
    this.#initCameraControls();
    this.#initForm();
    this.#initSaveDraft();
  }

  #initMap() {
    this.#map = L.map('add-map', { zoomControl: true }).setView([-2.5, 118], 5);
    setTimeout(() => this.#map.invalidateSize(), 100);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    });
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
    });
    osm.addTo(this.#map);
    L.control.layers({ 'OpenStreetMap': osm, 'Topografi': topo }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLat = lat;
      this.#selectedLon = lng;

      if (this.#marker) this.#marker.remove();
      this.#marker = L.marker([lat, lng]).addTo(this.#map)
        .bindPopup('Lokasi dipilih').openPopup();

      document.getElementById('location-info').textContent =
        `Lokasi: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });
  }

  #initPhotoTabs() {
    const tabUpload = document.getElementById('tab-upload');
    const tabCamera = document.getElementById('tab-camera');
    const panelUpload = document.getElementById('panel-upload');
    const panelCamera = document.getElementById('panel-camera');

    tabUpload.addEventListener('click', () => {
      tabUpload.classList.add('active');
      tabUpload.setAttribute('aria-selected', 'true');
      tabCamera.classList.remove('active');
      tabCamera.setAttribute('aria-selected', 'false');
      panelUpload.hidden = false;
      panelCamera.hidden = true;
      this.#stopCamera();
    });

    tabCamera.addEventListener('click', () => {
      tabCamera.classList.add('active');
      tabCamera.setAttribute('aria-selected', 'true');
      tabUpload.classList.remove('active');
      tabUpload.setAttribute('aria-selected', 'false');
      panelCamera.hidden = false;
      panelUpload.hidden = true;
    });

    document.getElementById('photo-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        document.getElementById('preview-img-upload').src = url;
        document.getElementById('photo-preview-upload').hidden = false;
      }
    });
  }

  #initCameraControls() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const startBtn = document.getElementById('start-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const stopBtn = document.getElementById('stop-camera-btn');

    startBtn.addEventListener('click', async () => {
      try {
        this.#mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = this.#mediaStream;
        video.hidden = false;
        startBtn.disabled = true;
        captureBtn.disabled = false;
        stopBtn.disabled = false;
      } catch (err) {
        this.showError('Tidak dapat mengakses kamera: ' + err.message);
      }
    });

    captureBtn.addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        this.#capturedBlob = blob;
        const url = URL.createObjectURL(blob);
        document.getElementById('preview-img-camera').src = url;
        document.getElementById('photo-preview-camera').hidden = false;
      }, 'image/jpeg', 0.8);
    });

    stopBtn.addEventListener('click', () => this.#stopCamera());
  }

  #stopCamera() {
    if (this.#mediaStream) {
      this.#mediaStream.getTracks().forEach(t => t.stop());
      this.#mediaStream = null;
    }
    const video = document.getElementById('camera-video');
    if (video) { video.srcObject = null; video.hidden = true; }
    const startBtn = document.getElementById('start-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    if (startBtn) { startBtn.disabled = false; captureBtn.disabled = true; stopBtn.disabled = true; }
  }

  #getPhotoFile() {
    const isCameraTab = !document.getElementById('panel-camera').hidden;
    if (isCameraTab) {
      return this.#capturedBlob 
        ? new File([this.#capturedBlob], 'camera-photo.jpg', { type: 'image/jpeg' }) 
        : null;
    }
    return document.getElementById('photo-file').files[0] || null;
  }

  #initForm() {
    document.getElementById('add-story-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.#validate()) return;

      const formData = new FormData();
      formData.append('description', document.getElementById('description').value.trim());
      formData.append('photo', this.#getPhotoFile());
      if (this.#selectedLat !== null) {
        formData.append('lat', this.#selectedLat);
        formData.append('lon', this.#selectedLon);
      }
      await this.#presenter.submitStory(formData);
    });
  }

  #validate() {
    let valid = true;
    document.getElementById('description-error').textContent = '';
    document.getElementById('photo-error').textContent = '';

    if (!document.getElementById('description').value.trim()) {
      document.getElementById('description-error').textContent = 'Deskripsi tidak boleh kosong.';
      valid = false;
    }
    if (!this.#getPhotoFile()) {
      document.getElementById('photo-error').textContent = 'Foto wajib diisi.';
      valid = false;
    }
    return valid;
  }

  showLoading() {
    document.querySelector('#add-story-form .btn-text').hidden = true;
    document.querySelector('#add-story-form .btn-loading').hidden = false;
    document.getElementById('submit-btn').disabled = true;
  }

  hideLoading() {
    document.querySelector('#add-story-form .btn-text').hidden = false;
    document.querySelector('#add-story-form .btn-loading').hidden = true;
    document.getElementById('submit-btn').disabled = false;
  }

  showError(msg) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal Mengirim',
      text: msg,
      confirmButtonColor: '#1a6fc4',
    });
  }

  onSubmitSuccess() {
    this.#stopCamera();
    Swal.fire({
      icon: 'success',
      title: 'Cerita Terkirim!',
      text: 'Ceritamu berhasil dibagikan.',
      timer: 1800,
      showConfirmButton: false,
    }).then(() => {
      window.location.hash = '#/';
    });
  }

  #initSaveDraft() {
    document.getElementById('save-draft-btn').addEventListener('click', async () => {
      const description = document.getElementById('description').value.trim();
      if (!description) {
        Swal.fire({
          icon: 'warning',
          title: 'Deskripsi Kosong',
          text: 'Isi deskripsi terlebih dahulu sebelum menyimpan draft.',
          confirmButtonColor: '#1a6fc4',
        });
        return;
      }

      const draft = {
        description,
        lat: this.#selectedLat,
        lon: this.#selectedLon,
        createdAt: new Date().toISOString(),
        photoBlob: null,
      };

      const photo = this.#getPhotoFile();
      if (photo) draft.photoBlob = photo;

      try {
        await saveDraft(draft);
        Swal.fire({
          icon: 'success',
          title: 'Draft Disimpan!',
          text: 'Kamu bisa mengirimnya nanti di halaman Draft.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.hash = '#/drafts';
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Draft',
          text: err.message,
          confirmButtonColor: '#1a6fc4',
        });
      }
    });
  }
}