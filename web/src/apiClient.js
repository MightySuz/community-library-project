// Simple API client wrapper
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function getBooks() {
  const data = await apiFetch('/books');
  return data.data?.items || [];
}
