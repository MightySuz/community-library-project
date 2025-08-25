// Simple API client wrapper with minimal auth token support
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken() {
  try { return localStorage.getItem('communityLibraryJwt'); } catch { return null; }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers||{}) },
    ...options,
  });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getBooks() {
  const data = await apiFetch('/books');
  return data.data?.items || [];
}

export async function createBook(book) {
  const data = await apiFetch('/books', { method:'POST', body: JSON.stringify(book) });
  return data.data.book;
}

export async function createRequest({ bookId, startDate, endDate }) {
  const data = await apiFetch('/requests', { method:'POST', body: JSON.stringify({ bookId, startDate, endDate }) });
  return data.data.request;
}

export async function listMyRequests() {
  const data = await apiFetch('/requests/mine');
  return data.data.items;
}

export async function listPublisherPending() {
  const data = await apiFetch('/requests/publisher/pending');
  return data.data.items;
}

export async function approveRequest(id) {
  const data = await apiFetch(`/requests/${id}/approve`, { method:'POST' });
  return data.data.request;
}

export async function returnRequest(id) {
  const data = await apiFetch(`/requests/${id}/return`, { method:'POST' });
  return data.data.request;
}
