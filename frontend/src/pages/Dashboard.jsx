import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStats, getSummary, getTickets, markSeen, generateBulkDraft, sendBulkReply, pollNow, getInboxStatus } from '../lib/api';
import Card from '../components/Card';
import Modal from '../components/Modal';

const INTENSITIES = ['All', 'critical', 'high', 'medium', 'low'];
const SENTIMENTS = ['All', 'negative', 'neutral', 'positive'];
const DEPARTMENTS = ['All', 'IT', 'HR', 'Finance', 'Customer Support', 'Legal', 'Admin', 'Manager', 'Agent'];

// Match email addresses (simple RFC-style pattern); capturing group so split() includes them
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function parseEmailsInText(text) {
  if (!text || typeof text !== 'string') return ['(No body)'];
  const tokens = text.split(EMAIL_REGEX);
  return tokens.map((token, i) => {
    if (token.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return <a key={i} href={`mailto:${token}`} className="text-[var(--accent)] hover:underline break-all">{token}</a>;
    }
    return token;
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState('');
  const [tickets, setTickets] = useState([]);
  const [monthByMonthOpen, setMonthByMonthOpen] = useState(false);
  const [filterIntensity, setFilterIntensity] = useState('All');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [expandedClusters, setExpandedClusters] = useState(new Set());
  const [bulkModal, setBulkModal] = useState(null); // { subject, count, ticketIds }
  const [bulkDraft, setBulkDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inboxStatus, setInboxStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);

  useEffect(() => {
    // Initial fetch of inbox status
    getInboxStatus().then(setInboxStatus).catch(() => { });
  }, []);

  useEffect(() => {
    Promise.all([getStats(), getSummary(), getTickets()])
      .then(([s, sum, t]) => {
        setStats(s);
        setSummary(sum.summary || '');
        setTickets(t.tickets || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = {};
    if (filterIntensity !== 'All') params.intensity = filterIntensity;
    if (filterSentiment !== 'All') params.sentiment = filterSentiment;
    if (filterDepartment !== 'All') params.department = filterDepartment;
    if (searchQuery) params.search = searchQuery;
    if (myTicketsOnly) params.myTickets = 'true';

    // Debounce search a bit if needed, but for now direct is fine or use a timeout
    const delayDebounce = setTimeout(() => {
      getTickets(params).then((r) => setTickets(r.tickets || [])).catch(() => { });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filterIntensity, filterSentiment, filterDepartment, searchQuery, myTicketsOnly]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function openTicket(t) {
    setSelectedTicket(t);
    if (t.seen) return;
    try {
      await markSeen(t._id);
      const s = await getStats();
      setStats(s);
      setTickets((prev) => prev.map((x) => (x._id === t._id ? { ...x, seen: true } : x)));
    } catch (_) { }
  }

  const { clusters, singles } = useMemo(() => {
    const groups = {};
    if (!tickets) return { clusters: [], singles: [] };

    tickets.forEach(t => {
      const raw = t.subject || '(No subject)';
      // Normalize: lowercase, collapse spaces, trim
      const subject = raw.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!groups[subject]) groups[subject] = [];
      groups[subject].push(t);
    });

    const c = [];
    const s = [];

    Object.keys(groups).forEach(sub => {
      const group = groups[sub];
      if (group.length > 1) {
        let severity = 'low';
        if (group.some(x => x.intensity === 'critical')) severity = 'critical';
        else if (group.some(x => x.intensity === 'high')) severity = 'high';
        else if (group.some(x => x.intensity === 'medium')) severity = 'medium';

        c.push({
          subject: sub,
          emails: group,
          severity,
          count: group.length,
          lastDate: group.reduce((latest, x) => Math.max(latest, new Date(x.createdAt).getTime()), 0)
        });
      } else {
        s.push(group[0]);
      }
    });

    const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };
    c.sort((a, b) => {
      const diff = severityRank[b.severity] - severityRank[a.severity];
      if (diff !== 0) return diff;
      return b.lastDate - a.lastDate;
    });

    return { clusters: c, singles: s };
  }, [tickets]);

  const toggleCluster = (subject) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  async function handleBulkReply(e, cluster) {
    e.stopPropagation(); // prevent expand
    const ticketIds = cluster.emails.map(t => t._id);
    setBulkModal({ subject: cluster.subject, count: cluster.count, ticketIds });
    setBulkDraft('Generating draft response...');
    setIsDrafting(true);
    try {
      const res = await generateBulkDraft(cluster.subject, ticketIds);
      setBulkDraft(res.draft || 'Could not generate draft.');
    } catch (err) {
      setBulkDraft('Error generating draft: ' + err.message);
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSendBulk() {
    if (!bulkModal || !bulkDraft) return;
    setIsSending(true);
    try {
      await sendBulkReply(bulkModal.ticketIds, bulkDraft);
      const msg = bulkModal.count === 1 ? 'user' : 'users';
      alert(`Sent reply to ${bulkModal.count} ${msg} successfully.`);
      setBulkModal(null);
      setBulkDraft('');
      // Optionally refresh tickets/stats
      getStats().then(setStats);
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      await pollNow(50); // Fetch top 50
      const s = await getStats();
      setStats(s);
      const t = await getTickets({
        intensity: filterIntensity !== 'All' ? filterIntensity : undefined,
        sentiment: filterSentiment !== 'All' ? filterSentiment : undefined,
        department: filterDepartment !== 'All' ? filterDepartment : undefined,
        search: searchQuery || undefined,
        myTickets: myTicketsOnly ? 'true' : undefined
      });
      setTickets(t.tickets || []);
      const is = await getInboxStatus();
      setInboxStatus(is);
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  function handleExportCSV() {
    if (!tickets || tickets.length === 0) return;
    const headers = ['ID', 'Subject', 'Sender', 'Intensity', 'Sentiment', 'Department', 'Created At'];
    const rows = tickets.map(t => [
      t._id,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      t.sender,
      t.intensity,
      t.sentiment,
      t.department,
      t.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'tickets_export.csv', 'text/csv');
  }

  function handleExportJSON() {
    if (!tickets || tickets.length === 0) return;
    const jsonContent = JSON.stringify(tickets, null, 2);
    downloadFile(jsonContent, 'tickets_export.json', 'application/json');
  }

  async function handleSingleReply(e, ticket) {
    e.stopPropagation(); // prevent open
    const ticketIds = [ticket._id];
    setBulkModal({ subject: ticket.subject, count: 1, ticketIds, type: 'auto' });
    setBulkDraft('');
    setIsDrafting(true);
    try {
      // ... same generation logic
      const drafts = await generateBulkDraft('Reply to user', [ticket.body]);
      setBulkDraft(drafts.draft);
    } catch (err) {
      alert('Failed to draft: ' + err.message);
      setBulkModal(null); // close if failed
    } finally {
      setIsDrafting(false);
    }
  }

  function handleManualReply(ticket) {
    if (selectedTicket) setSelectedTicket(null);
    const ticketIds = [ticket._id];
    setBulkModal({ subject: ticket.subject, count: 1, ticketIds, type: 'manual' });
    setBulkDraft(''); // Empty for manual
    setIsDrafting(false);
  }

  const heatmap = stats?.heatmap || { critical: { count: 0, pct: 0 }, high: { count: 0, pct: 0 }, medium: { count: 0, pct: 0 }, low: { count: 0, pct: 0 } };
  const totalHeat = heatmap.critical.count + heatmap.high.count + heatmap.medium.count + heatmap.low.count;

  return (
    <div className="flex min-h-screen bg-[var(--bg-dark)]">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-[var(--border)] flex flex-col transition-all duration-300 shadow-[var(--shadow-sm)] ${sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)] h-16">
          {!sidebarCollapsed && <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">Mail<span className="text-[var(--accent)]">Mitra</span></span>}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-dark)] text-[var(--text-muted)] transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            )}
          </button>
        </div>
        <div className="p-4 border-b border-[var(--border)] bg-slate-50/50">
          {!sidebarCollapsed && (
            <>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Signed in as</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <p className="text-[var(--text-primary)] font-medium truncate">{user?.name || 'User'}</p>
              </div>
            </>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {!sidebarCollapsed && (
            <ul className="space-y-1">
              <li>
                <a href="#dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] font-semibold transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  Dashboard
                </a>
              </li>
            </ul>
          )}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-md py-2.5 px-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        {/* Header / Page title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Overview of tickets and emails</p>
          </div>

          <div className="flex items-center gap-4">
            {inboxStatus?.email && (
              <div className="flex items-center gap-2 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                {inboxStatus.email} • {inboxStatus.messageCount ?? '?'} messages
              </div>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-white border border-[var(--border)] rounded-[var(--radius-md)] text-sm font-semibold text-[var(--text-primary)] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Sync inbox'}
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 animate-pulse">
                  <div className="h-4 w-24 bg-[var(--border)] rounded mb-3" />
                  <div className="h-8 w-16 bg-[var(--border)] rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 animate-pulse">
                <div className="h-4 w-32 bg-[var(--border)] rounded mb-4" />
                <div className="grid grid-cols-2 gap-2 aspect-square max-w-xs">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="rounded-[var(--radius-md)] bg-[var(--border)]" />
                  ))}
                </div>
              </div>
              <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 animate-pulse">
                <div className="h-4 w-40 bg-[var(--border)] rounded mb-3" />
                <div className="h-24 bg-[var(--border)] rounded" />
              </div>
            </div>
            <div>
              <div className="h-4 w-16 bg-[var(--border)] rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-16 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top row: 4 metric blocks */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-slide-in" style={{ animationDelay: '0ms' }}>
              <Card hover>
                <p className="text-sm text-[var(--text-muted)] mb-1">Total tickets (this month)</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stats?.totalThisMonth ?? 0}</p>
                <button
                  onClick={() => setMonthByMonthOpen(true)}
                  className="mt-2 text-sm text-[var(--accent)] hover:underline"
                >
                  Month by month
                </button>
              </Card>
              <Card hover>
                <p className="text-sm text-[var(--text-muted)] mb-1">Unseen tickets</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stats?.unseenCount ?? 0}</p>
              </Card>
              <Card hover>
                <p className="text-sm text-[var(--text-muted)] mb-1">Open tickets</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stats?.openCount ?? 0}</p>
              </Card>
              <Card hover>
                <p className="text-sm text-[var(--text-muted)] mb-1">Closed tickets</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stats?.closedCount ?? 0}</p>
              </Card>
            </div>

            {/* Second row: Heatmap + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 mb-6 animate-fade-slide-in" style={{ animationDelay: '50ms' }}>
              <Card className="w-fit">
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">Incident heatmap</h3>
                <div className="grid grid-cols-2 gap-2 aspect-square w-[12rem]">
                  <div className="rounded-[var(--radius-md)] bg-red-600/80 flex flex-col items-center justify-center text-white text-sm font-medium p-2 border border-red-500/30 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
                    <span>Critical</span>
                    <span>{heatmap.critical.pct}%</span>
                    <span className="text-xs opacity-80">({heatmap.critical.count})</span>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-orange-500/80 flex flex-col items-center justify-center text-white text-sm font-medium p-2 border border-orange-400/30 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
                    <span>High</span>
                    <span>{heatmap.high.pct}%</span>
                    <span className="text-xs opacity-80">({heatmap.high.count})</span>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-yellow-500/80 flex flex-col items-center justify-center text-black text-sm font-medium p-2 border border-yellow-400/30 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
                    <span>Medium</span>
                    <span>{heatmap.medium.pct}%</span>
                    <span className="text-xs opacity-80">({heatmap.medium.count})</span>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-green-600/80 flex flex-col items-center justify-center text-white text-sm font-medium p-2 border border-green-500/30 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
                    <span>Low</span>
                    <span>{heatmap.low.pct}%</span>
                    <span className="text-xs opacity-80">({heatmap.low.count})</span>
                  </div>
                </div>
              </Card>
              <Card className="border-l-4 border-l-[var(--accent)] pl-8">
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Summary (unseen emails)</h3>
                {summary ? (
                  <ul className="text-sm text-[var(--text-primary)] leading-relaxed min-h-[120px] list-disc list-inside space-y-1.5 pl-1">
                    {summary
                      .split(/(?<=[.!?])\s+/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] min-h-[120px]">No unseen emails to summarize.</p>
                )}
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6 animate-fade-slide-in p-4 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Filter Tickets</p>
                </div>
                <div className="flex gap-3 text-xs font-medium">
                  <button onClick={handleExportCSV} className="text-[var(--accent)] hover:underline">Export CSV</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={handleExportJSON} className="text-[var(--accent)] hover:underline">Export JSON</button>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Search (subject/body)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type and press Enter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] bg-white border border-[var(--border)] pl-3 pr-10 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent h-10 shadow-sm text-sm"
                    />
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center bg-[var(--accent)] text-white rounded-r-[var(--radius-md)] cursor-pointer hover:bg-opacity-90">
                      Search
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Intensity</label>
                  <select
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(e.target.value)}
                    className="rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-w-[140px] h-10 shadow-sm"
                  >
                    {INTENSITIES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Sentiment</label>
                  <select
                    value={filterSentiment}
                    onChange={(e) => setFilterSentiment(e.target.value)}
                    className="rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-w-[140px] h-10 shadow-sm"
                  >
                    {SENTIMENTS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Department</label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-w-[160px] h-10 shadow-sm"
                  >
                    {DEPARTMENTS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center h-10 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={myTicketsOnly}
                      onChange={(e) => setMyTicketsOnly(e.target.checked)}
                      className="rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    My tickets only
                  </label>
                </div>
              </div>
            </div>

            {/* Email list */}
            <div className="animate-fade-slide-in" style={{ animationDelay: '150ms' }}>
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Emails</h3>
              <div className="space-y-2">
                {tickets.length === 0 ? (
                  <div className="animate-fade-slide-in rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
                    <p className="text-4xl text-[var(--text-muted)]/50 mb-2" aria-hidden>✉</p>
                    <p className="font-medium text-[var(--text-primary)]">No tickets yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Connect IMAP or sync your inbox to see emails here.</p>
                  </div>
                ) : (
                  <>
                    {/* Clusters */}
                    {clusters.map((cluster) => {
                      const isExpanded = expandedClusters.has(cluster.subject);
                      const
                        bgColor = cluster.severity === 'critical' || cluster.severity === 'high' ? 'bg-red-100 border-red-300' :
                          cluster.severity === 'medium' ? 'bg-yellow-100 border-yellow-300' :
                            'bg-blue-100 border-blue-300';

                      const stripeColor = cluster.severity === 'critical' || cluster.severity === 'high' ? 'bg-red-500' :
                        cluster.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500';

                      return (
                        <div key={cluster.subject} className="animate-fade-slide-in">
                          <button
                            onClick={() => toggleCluster(cluster.subject)}
                            className={`w-full text-left rounded-[var(--radius-lg)] border p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md relative group ${bgColor}`}
                          >
                            {/* Stripe for consistent visual pop */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[var(--radius-lg)] ${stripeColor}`} />

                            {/* Count Badge */}
                            <div className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl rounded-tr-[var(--radius-lg)] text-xs font-bold text-white shadow-sm ${stripeColor}`}>
                              {cluster.count}
                            </div>

                            <div className="pl-3 flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-base font-bold text-[var(--text-primary)] truncate">{cluster.subject}</h4>
                                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${cluster.severity === 'critical' || cluster.severity === 'high' ? 'bg-red-200 text-red-800' :
                                  cluster.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-blue-200 text-blue-800'
                                  }`}>
                                  {cluster.severity === 'critical' || cluster.severity === 'high' ? 'Alert' : cluster.severity}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-primary)]/80">
                                {cluster.count} similar emails grouped. Latest: {new Date(cluster.lastDate).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 mr-2">
                              <button
                                onClick={(e) => handleBulkReply(e, cluster)}
                                className="px-3 py-1.5 bg-white/50 hover:bg-white text-[var(--text-primary)] text-xs font-semibold rounded shadow-sm border border-[var(--border)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Generate AI reply for all"
                              >
                                ✨ AI Reply All
                              </button>
                              <div className="text-[var(--text-primary)]/60">
                                {isExpanded ? (
                                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                ) : (
                                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Expanded Emails */}
                          {isExpanded && (
                            <div className="ml-4 pl-4 border-l-2 border-[var(--border)] mt-2 space-y-2">
                              {cluster.emails.map((t, i) => (
                                <button
                                  type="button"
                                  key={t._id || t.ticketId || t.subject + t.createdAt}
                                  onClick={() => openTicket(t)}
                                  className={`w-full text-left bg-white rounded-[var(--radius-lg)] border p-3 flex flex-wrap items-center gap-3 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-sm ${!t.seen ? 'border-l-4 border-l-[var(--accent)] border-y-[var(--border)] border-r-[var(--border)]' : 'border-[var(--border)] opacity-90'
                                    }`}
                                >
                                  <div className="flex-1 min-w-0 flex items-start gap-3">
                                    {!t.seen ? (
                                      <div className="mt-1.5 w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 shadow-sm" aria-label="Unread" />
                                    ) : (
                                      <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-200 shrink-0" aria-label="Read" />
                                    )}
                                    <div className="min-w-0">
                                      <p className={`truncate text-sm ${!t.seen ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-muted)]'}`}>{t.subject || '(No subject)'}</p>
                                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.sender || '—'} · {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${t.intensity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                      t.intensity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        t.intensity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'
                                      }`}>{t.intensity}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{t.sentiment}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{t.department}</span>
                                    {t.priority && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-200">{t.priority}</span>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Singles */}
                    {singles.map((t, i) => (
                      <button
                        type="button"
                        key={t._id || t.ticketId || t.subject + t.createdAt}
                        onClick={() => openTicket(t)}
                        className={`w-full text-left bg-white rounded-[var(--radius-lg)] border p-4 flex flex-wrap items-center gap-4 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md animate-fade-slide-in group ${!t.seen ? 'border-l-4 border-l-[var(--accent)] border-y-[var(--border)] border-r-[var(--border)]' : 'border-[var(--border)] opacity-90'
                          }`}
                        style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                      >
                        <div className="flex-1 min-w-0 flex items-start gap-3">
                          {!t.seen ? (
                            <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0 shadow-sm" aria-label="Unread" />
                          ) : (
                            <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" aria-label="Read" />
                          )}
                          <div className="min-w-0">
                            <p className={`truncate text-sm ${!t.seen ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-muted)]'}`}>{t.subject || '(No subject)'}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.sender || '—'} · {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleSingleReply(e, t)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-[var(--text-primary)] text-xs font-semibold rounded shadow-sm border border-[var(--border)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Generate AI reply"
                        >
                          ✨ AI Reply
                        </button>

                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${t.intensity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            t.intensity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              t.intensity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'
                            }`}>{t.intensity}</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">{t.sentiment}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Email detail modal */}
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={selectedTicket?.subject || '(No subject)'}
          maxWidth="max-w-lg"
        >
          {selectedTicket && (
            <>
              <div className="space-y-2 text-sm mb-4 -mt-2">
                <p className="text-[var(--text-muted)]">
                  From:{' '}
                  {selectedTicket.sender && /@/.test(selectedTicket.sender) ? (
                    <a
                      href={`mailto:${selectedTicket.sender.replace(/^.*<([^>]+)>.*$/, '$1').trim() || selectedTicket.sender}`}
                      className="text-[var(--accent)] hover:underline break-all"
                    >
                      {selectedTicket.sender}
                    </a>
                  ) : (
                    selectedTicket.sender || '—'
                  )}
                </p>
                <p className="text-[var(--text-muted)]">
                  {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${selectedTicket.intensity === 'critical' ? 'bg-red-600/30' :
                    selectedTicket.intensity === 'high' ? 'bg-orange-500/30' :
                      selectedTicket.intensity === 'medium' ? 'bg-yellow-500/30' : 'bg-green-600/30'
                    }`}>{selectedTicket.intensity}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-500/30 capitalize">{selectedTicket.sentiment}</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-[var(--bg-dark)] border border-[var(--border)] p-4 text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                {parseEmailsInText(selectedTicket.body)}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleManualReply(selectedTicket)}
                  className="flex-1 rounded-lg py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  Reply
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 rounded-lg py-2 bg-[var(--border)] hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Month by month modal */}
        <Modal
          open={monthByMonthOpen}
          onClose={() => setMonthByMonthOpen(false)}
          title="Month by month tickets"
          maxWidth="max-w-md"
        >
          <div className="space-y-2 max-h-64 overflow-auto">
            {(stats?.monthByMonth || []).map(({ year, month, count }) => (
              <div key={`${year}-${month}`} className="flex justify-between text-sm">
                <span>{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {(!stats?.monthByMonth || stats.monthByMonth.length === 0) && (
              <p className="text-[var(--text-muted)] text-sm">No data yet</p>
            )}
          </div>
          <button
            onClick={() => setMonthByMonthOpen(false)}
            className="mt-4 w-full rounded-lg py-2 bg-[var(--border)] hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </Modal>

        {/* Bulk/Single Reply Modal */}
        <Modal
          open={!!bulkModal}
          onClose={() => setBulkModal(null)}
          title={bulkModal?.type === 'manual' ? `Reply to "${bulkModal?.subject}"` : (bulkModal?.count === 1 ? `AI Reply to "${bulkModal?.subject}"` : `Bulk Reply to "${bulkModal?.subject}"`)}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {bulkModal?.type !== 'manual' && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">
                Reply to <strong>{bulkModal?.count}</strong> {bulkModal?.count === 1 ? 'user' : 'users'}. This will send {bulkModal?.count === 1 ? 'an email' : 'individual emails'} to each recipient.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {bulkModal?.type === 'manual' ? 'Your Reply' : 'AI Drafted Response'}
              </label>
              <textarea
                value={bulkDraft}
                onChange={(e) => setBulkDraft(e.target.value)}
                className="w-full text-sm p-3 rounded-lg bg-[var(--bg-dark)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] outline-none min-h-[150px]"
                disabled={isDrafting || isSending}
                placeholder={bulkModal?.type === 'manual' ? "Write your reply here..." : ""}
                autoFocus={bulkModal?.type === 'manual'}
              />
              {isDrafting && <p className="text-xs text-[var(--text-muted)] mt-1 animate-pulse">Generating proper response using AI...</p>}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setBulkModal(null)}
                className="px-4 py-2 rounded-lg bg-[var(--border)] text-[var(--text-primary)] hover:bg-opacity-80 transition-colors"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulk}
                disabled={isDrafting || isSending || !bulkDraft}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-opacity-90 transition-colors font-medium flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Sending...
                  </>
                ) : (bulkModal?.count === 1 ? 'Send Reply' : 'Send to All')}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
