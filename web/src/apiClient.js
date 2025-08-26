// Simple API client wrapper with minimal auth token support
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Expose for runtime diagnostics
if (typeof window !== 'undefined') {
  window.__COMLIB_API_BASE = API_BASE;
  if (window.location.hostname !== 'localhost' && /localhost/.test(API_BASE)) {
    // eslint-disable-next-line no-console
    console.warn('[ComLib] Frontend is deployed but API_BASE still points to localhost. Backend calls will fail until you deploy the API and rebuild with REACT_APP_API_URL.');
  }
}

function getToken() {
  try { return localStorage.getItem('communityLibraryJwt'); } catch { return null; }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  console.log('[apiFetch] ->', url, options.method||'GET');
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers||{}) },
    ...options,
  });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
    console.warn('[apiFetch] error', url, res.status, msg);
    throw new Error(msg);
  }
  console.log('[apiFetch] success', url, res.status);
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

export async function loginUser(email, password) {
  const data = await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
  return data.data; // { user, tokens, message }
}

export async function registerUser(payload) {
  const data = await apiFetch('/auth/register', { method:'POST', body: JSON.stringify(payload) });
  return data.data; // { userId, email, phoneNumber, message }
}

export async function verifyOtp(payload) {
  const data = await apiFetch('/auth/verify-otp', { method:'POST', body: JSON.stringify(payload) });
  return data.data; // { message, verified }
}

export async function listUsersAdmin(params={}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/users${qs?'?'+qs:''}`);
  return data.data.items;
}
