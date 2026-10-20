const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('inkwell_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

const AuthAPI = {
  register: (username, email, password) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch('/auth/me'),
};

const PostsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/posts${query ? '?' + query : ''}`);
  },

  get: (id) => apiFetch(`/posts/${id}`),

  create: (title, content) =>
    apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  update: (id, title, content) =>
    apiFetch(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    }),

  delete: (id) =>
    apiFetch(`/posts/${id}`, { method: 'DELETE' }),
};

const CommentsAPI = {
  create: (post_id, content) =>
    apiFetch('/comments', {
      method: 'POST',
      body: JSON.stringify({ post_id, content }),
    }),

  delete: (id) =>
    apiFetch(`/comments/${id}`, { method: 'DELETE' }),
};
