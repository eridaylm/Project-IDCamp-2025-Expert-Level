
const DB_NAME = 'storyapp-db';
const DB_VERSION = 1;
const STORE_DRAFTS = 'drafts';
const STORE_STORIES = 'cached-stories';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        const draftStore = db.createObjectStore(STORE_DRAFTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        draftStore.createIndex('createdAt', 'createdAt', { unique: false });
        draftStore.createIndex('synced', 'synced', { unique: false });
      }

      
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        const storyStore = db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
        storyStore.createIndex('createdAt', 'createdAt', { unique: false });
        storyStore.createIndex('name', 'name', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    const data = {
      ...draft,
      createdAt: draft.createdAt || new Date().toISOString(),
      synced: false,
    };
    const req = store.add(data);
    req.onsuccess = () => resolve(req.result); 
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDrafts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
    req.onerror = () => reject(req.error);
  });
}

export async function getDraft(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const req = tx.objectStore(STORE_DRAFTS).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const req = tx.objectStore(STORE_DRAFTS).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function markDraftSynced(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const draft = getReq.result;
      if (!draft) return resolve();
      draft.synced = true;
      const putReq = store.put(draft);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getUnsyncedDrafts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const index = tx.objectStore(STORE_DRAFTS).index('synced');
    const req = index.getAll(IDBKeyRange.only(false));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function searchDrafts(query) {
  const all = await getAllDrafts();
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(d =>
    d.description?.toLowerCase().includes(q)
  );
}

export async function cacheStories(stories) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readwrite');
    const store = tx.objectStore(STORE_STORIES);
    stories.forEach((s) => store.put(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readonly');
    const req = tx.objectStore(STORE_STORIES).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
    req.onerror = () => reject(req.error);
  });
}