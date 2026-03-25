import '../styles/styles.css';
import App from './pages/app.js';
import { registerServiceWorker } from './pwa/push-manager.js';
import { getUnsyncedDrafts, markDraftSynced } from './db/idb.js';
import { addStory } from './data/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  
  await registerServiceWorker();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    document.getElementById('main-content').focus();
  });

  
  window.addEventListener('online', async () => {
    console.log('[App] Back online — syncing drafts...');
    try {
      const drafts = await getUnsyncedDrafts();
      for (const draft of drafts) {
        try {
          const formData = new FormData();
          formData.append('description', draft.description);
          if (draft.photoBlob) formData.append('photo', draft.photoBlob, 'draft-photo.jpg');
          if (draft.lat) formData.append('lat', draft.lat);
          if (draft.lon) formData.append('lon', draft.lon);
          await addStory(formData);
          await markDraftSynced(draft.id);
        } catch (e) {
          console.warn('[App] Failed to sync draft', draft.id, e.message);
        }
      }
    } catch (e) {
      console.warn('[App] Sync error:', e);
    }
  });

  
  navigator.serviceWorker?.addEventListener('message', async (e) => {
    if (e.data?.type === 'SYNC_DRAFTS') {
      window.dispatchEvent(new Event('online'));
    }
  });
});



function showBanner(msg, isOnline = false) {
  const existing = document.querySelector('.offline-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = `offline-banner${isOnline ? ' online' : ''}`;
  banner.textContent = msg;
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

window.addEventListener('offline', () => showBanner('⚡ Kamu offline — data mungkin tidak terbaru'));
window.addEventListener('online', () => showBanner('✓ Kembali online!', true));
