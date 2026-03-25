import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIF_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return data;
}

export async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return data;
}

export async function getStories({ page = 1, size = 20, location = 1 } = {}) {
  const url = new URL(ENDPOINTS.STORIES);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);
  url.searchParams.set('location', location);

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return data;
}

export async function addStory(formData) {
  const isLoggedIn = !!localStorage.getItem('token');
  const endpoint = isLoggedIn ? ENDPOINTS.ADD_STORY : ENDPOINTS.ADD_STORY_GUEST;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: isLoggedIn ? getAuthHeaders() : {},
    body: formData,
  });
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return data;
}
