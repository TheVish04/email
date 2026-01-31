// In production (Vercel), use Render backend URL. Locally, use /api (proxied by Vite).
function getApiBase() {
  const url = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (!url) return '/api';
  const base = url.replace(/\/api$/, '');
  return `${base}/api`;
}
const API_BASE = getApiBase();

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

/** Safely parse JSON from response; throws a clear error if response is HTML or invalid. */
async function parseJsonResponse(res, fallbackError) {
  const text = await res.text();
  if (!text || !text.trim()) {
    if (!res.ok) throw new Error(fallbackError || 'Server returned an empty response');
    return {};
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!isJson) {
    const msg = res.status === 404
      ? 'Backend not reachable. Make sure the backend is running (e.g. `npm run dev` in the backend folder) on port 3001.'
      : fallbackError || 'Server returned an unexpected response. Make sure the backend is running.';
    throw new Error(msg);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(res.status === 404
      ? 'Backend not reachable. Make sure the backend is running on port 3001.'
      : fallbackError || 'Invalid server response.');
  }
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(res, 'Login failed');
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(body) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res, 'Registration failed');
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function getRoles() {
  const res = await fetch(`${API_BASE}/auth/roles`);
  const data = await parseJsonResponse(res, 'Failed to load roles');
  return {
    roles: data.roles || [],
    roleLabels: data.roleLabels || {},
    departments: data.departments || [],
  };
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`, { headers: headers() });
  const data = await parseJsonResponse(res, 'Failed to fetch stats');
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data;
}

export async function getSummary() {
  const res = await fetch(`${API_BASE}/summary`, { headers: headers() });
  const data = await parseJsonResponse(res, 'Failed to fetch summary');
  if (!res.ok) throw new Error(data.error || 'Failed to fetch summary');
  return data;
}

export async function getTickets(params = {}) {
  // Filter out null/undefined to keep query clean
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  );
  const q = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_BASE}/tickets?${q}`, { headers: headers() });
  const data = await parseJsonResponse(res, 'Failed to fetch tickets');
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
  return data;
}

export async function classify(subject, body) {
  const res = await fetch(`${API_BASE}/classify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, body }),
  });
  const data = await parseJsonResponse(res, 'Classification failed');
  if (!res.ok) throw new Error(data.error || 'Classification failed');
  return data;
}

export async function getReviewItems() {
  const res = await fetch(`${API_BASE}/review`, { headers: headers() });
  const data = await parseJsonResponse(res, 'Failed to fetch review');
  if (!res.ok) throw new Error(data.error || 'Failed to fetch review');
  return data;
}

export async function submitReview(body) {
  const res = await fetch(`${API_BASE}/review`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res, 'Review failed');
  if (!res.ok) throw new Error(data.error || 'Review failed');
  return data;
}

export async function markSeen(ticketId) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/seen`, {
    method: 'PATCH',
    headers: headers(),
  });
  const data = await parseJsonResponse(res, 'Update failed');
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

/** Check IMAP connection to configured inbox. Returns { ok, email, messageCount, error? }. */
export async function getInboxStatus() {
  const res = await fetch(`${API_BASE}/inbox-status`, { headers: headers() });
  const data = await parseJsonResponse(res, 'Failed to check inbox');
  if (!res.ok) throw new Error(data.error || 'Failed to check inbox');
  return data;
}

/** Manually trigger inbox sync (fetch last N emails, classify, save). Returns { ok, processed, error? }. */
export async function pollNow(limit = 100) {
  const res = await fetch(`${API_BASE}/poll-now?limit=${limit}`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await parseJsonResponse(res, 'Sync failed');
  if (!res.ok) throw new Error(data.error || 'Sync failed');
  return data;
}
export async function generateBulkDraft(subject, ticketIds) {
  const res = await fetch(`${API_BASE}/bulk-draft`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, ticketIds }),
  });
  const data = await parseJsonResponse(res, 'Draft failed');
  if (!res.ok) throw new Error(data.error || 'Draft failed');
  return data;
}

export async function sendBulkReply(ticketIds, replyBody) {
  const res = await fetch(`${API_BASE}/bulk-send`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ticketIds, replyBody }),
  });
  const data = await parseJsonResponse(res, 'Send failed');
  if (!res.ok) throw new Error(data.error || 'Send failed');
  return data;
}
