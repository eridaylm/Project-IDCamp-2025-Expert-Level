# 📖 Story App - Advanced Edition

> Aplikasi web berbagi cerita dengan visualisasi lokasi pada peta interaktif — dibuat sebagai submission akhir (Proyek 2) IDCamp 2025 Expert Level.

![Story App Banner](https://img.shields.io/badge/IDCamp-Expert%20Level-1a6fc4?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Local_Storage-4BADD1?style=for-the-badge&logo=sqlite&logoColor=white)

---

## ✨ Fitur Baru (Pembaruan Proyek 2)

- **Progressive Web App (PWA)** — Mendukung instalasi aplikasi ke *homescreen* (Desktop & Mobile) dengan `manifest.json` yang komprehensif (termasuk *screenshots* dan *theme color*).
- **Offline Mode & Caching** — Aplikasi tetap bisa diakses walau tanpa koneksi internet! Menggunakan Service Worker (Workbox) untuk melakukan *caching* pada *App Shell* dan data dinamis dari API.
- **IndexedDB & Interaktivitas** — Data cerita disimpan secara lokal agar memuat lebih cepat. Dilengkapi dengan fitur interaktif seperti pencarian (*searching*), penyaringan (*filtering*), dan pengurutan (*sorting*) data secara luring.
- **Background Sync** — Bisa membuat cerita baru kapan saja! Jika dibuat saat *offline*, data akan disimpan sementara dan otomatis dikirim ke server (API) saat koneksi internet kembali terhubung.
- **Push Notification** — Berlangganan notifikasi *real-time* saat ada cerita baru dari API. Dilengkapi dengan tombol *toggle* (*subscribe/unsubscribe*) dan notifikasi yang bisa diklik untuk menuju halaman detail cerita.
- **Peningkatan UI/UX** — Menggunakan **SweetAlert2** untuk penanganan *error* dan notifikasi yang lebih elegan, serta penggunaan ikon untuk memperkaya antarmuka pengguna.

## ✨ Fitur Utama (Bawaan Proyek 1)

- **Autentikasi** — Register & login dengan JWT token.
- **Peta Interaktif** — Visualisasi lokasi cerita dengan Leaflet.js (mendukung *multiple tile layer*).
- **Sinkronisasi List ↔ Peta** — Klik kartu cerita, peta otomatis *zoom* ke lokasinya.
- **Pilih Lokasi di Peta** — Klik peta untuk menentukan koordinat cerita saat menambahkan data.
- **Aksesibilitas** — *Skip to content*, semantic HTML, dan *keyboard navigation*.

---

## 🛠️ Tech Stack Tambahan

| Kategori | Teknologi |
|---|---|
| PWA & Caching | Service Worker, Workbox, Web App Manifest |
| Local Database | IndexedDB (via library `idb`) |
| Background Process| Background Sync API, Web Push Notifications |
| Alert / UI | SweetAlert2, FontAwesome / Feather Icons |
| Bundler & Core | Vite v6, JavaScript ES2022, Leaflet.js v1.9 |

---

## 🏗️ Arsitektur (MVP & PWA)

Project ini mengadopsi arsitektur **MVP (Model-View-Presenter)** dengan dukungan **Service Worker** untuk kapabilitas luring:

```text
├── src/
│   ├── scripts/
│   │   ├── config.js                  # Konfigurasi BASE_URL & VAPID Key
│   │   ├── index.js                   # Entry point & inisiasi aplikasi
│   │   ├── data/
│   │   │   ├── api.js                 # Model — HTTP request ke API
│   │   │   └── idb.js                 # Model — Interaksi dengan IndexedDB
│   │   ├── presenters/                # Presenter — logika bisnis
│   │   ├── pages/                     # View — render UI & event handling
│   │   ├── routes/                    # URL Parser & Routes
│   │   └── utils/
│   │       ├── sw-register.js         # Registrasi Service Worker & Push Notif
│   │       └── background-sync.js     # Logika sinkronisasi data offline
│   ├── styles/
│   │   └── styles.css
│   ├── public/
│   │   ├── icons/                     # Aset ikon untuk PWA
│   │   └── screenshots/               # Aset screenshot untuk Manifest
├── index.html
├── manifest.json                      # Web App Manifest
└── sw.js                              # Service Worker (Workbox / Push Listeners)
```

## 🚀 Cara Menjalankan

### Prasyarat

- Node.js v18 atau lebih baru
- npm v9 atau lebih baru

### Instalasi & Development

```bash
# Clone repository
git clone https://github.com/eridaylm/Project-IDCamp-2025-Expert-Level.git
cd Project-IDCamp-2025-Expert-Level

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173` di browser.

### Build untuk Produksi & Review

```bash
# Build aplikasi
npm run build

# Menjalankan preview server untuk menguji Service Worker / PWA
npm run preview
```
*Catatan: Fitur PWA dan Service Worker berfungsi optimal saat dijalankan melalui mode production / preview.*
---

## 🌐 Deployment Publik

Aplikasi ini telah di-deploy dan dapat diakses secara publik melalui tautan berikut:
['https://ceritainweb.vercel.app/]

---

## 📄 Lisensi

Dibuat untuk keperluan submission IDCamp 2025 Expert Level — Dicoding Indonesia.
