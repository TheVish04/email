import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
      isActive ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="flex min-h-screen bg-[var(--bg-dark)]">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-[var(--border)] flex flex-col transition-all duration-300 shadow-[var(--shadow-sm)] ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)] h-16">
          {!sidebarCollapsed && (
            <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">
              Mail<span className="text-[var(--accent)]">Mitra</span>
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-dark)] text-[var(--text-muted)] transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
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
                <NavLink to="/dashboard" className={navLinkClass}>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/new-ticket" className={navLinkClass}>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Ticket
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </li>
            </ul>
          )}
          {sidebarCollapsed && (
            <div className="space-y-1">
              <NavLink to="/dashboard" className={({ isActive }) => `flex justify-center p-2.5 rounded-md ${isActive ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-gray-100'}`} title="Dashboard">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </NavLink>
              <NavLink to="/new-ticket" className={({ isActive }) => `flex justify-center p-2.5 rounded-md ${isActive ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-gray-100'}`} title="New Ticket">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
