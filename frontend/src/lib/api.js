const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(body) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function getRoles() {
  const res = await fetch(`${API_BASE}/auth/roles`);
  const data = await res.json();
  return {
    roles: data.roles || [],
    roleLabels: data.roleLabels || {},
    departments: data.departments || [],
  };
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data;
}

export async function getSummary() {
  const res = await fetch(`${API_BASE}/summary`, { headers: headers() });
  const data = await res.json();
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
  return data;
}

export async function classify(subject, body) {
  const res = await fetch(`${API_BASE}/classify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Classification failed');
  return data;
}

export async function getReviewItems() {
  const res = await fetch(`${API_BASE}/review`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch review');
  return data;
}

export async function submitReview(body) {
  const res = await fetch(`${API_BASE}/review`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Review failed');
  return data;
}

export async function markSeen(ticketId) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/seen`, {
    method: 'PATCH',
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

/** Check IMAP connection to configured inbox. Returns { ok, email, messageCount, error? }. */
export async function getInboxStatus() {
  const res = await fetch(`${API_BASE}/inbox-status`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to check inbox');
  return data;
}

/** Manually trigger inbox sync (fetch last N emails, classify, save). Returns { ok, processed, error? }. */
export async function pollNow(limit = 100) {
  const res = await fetch(`${API_BASE}/poll-now?limit=${limit}`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sync failed');
  return data;
}
export async function generateBulkDraft(subject, ticketIds) {
  const res = await fetch(`${API_BASE}/bulk-draft`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, ticketIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Draft failed');
  return data;
}

export async function sendBulkReply(ticketIds, replyBody) {
  const res = await fetch(`${API_BASE}/bulk-send`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ticketIds, replyBody }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Send failed');
  return data;
}
