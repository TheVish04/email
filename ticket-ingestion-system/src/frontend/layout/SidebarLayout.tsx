import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

export default function SidebarLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    // Determine Page Title
    const getPageTitle = () => {
        if (location.pathname === '/new-ticket') return 'New Ticket Submission';
        return 'Corporate Dashboard';
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside style={{
                width: collapsed ? '60px' : '240px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10
            }}>
                {/* Sidebar Header + Greeting */}
                <div style={{ 
                  padding: '1.5rem 1rem', 
                  borderBottom: '1px solid var(--border-color)', 
                  textAlign: collapsed ? 'center' : 'left'
                }}>
                  {!collapsed && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Good Morning,</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>Vishal</div>
                    </div>
                  )}
                  
                  <button 
                     onClick={() => setCollapsed(!collapsed)}
                     style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    {collapsed ? '☰' : '⬅ Collapse'}
                  </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '1rem' }}>
                   <NavLink 
                     to="/dashboard"
                     style={({ isActive }) => ({
                       display: 'block',
                       padding: '0.75rem 1rem',
                       marginBottom: '0.5rem',
                       borderRadius: '6px',
                       textDecoration: 'none',
                       color: isActive ? '#fff' : 'var(--text-secondary)',
                       backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent'
                     })}
                   >
                     {collapsed ? '📊' : '📊 Dashboard'}
                   </NavLink>
                   
                   <NavLink 
                     to="/new-ticket"
                     style={({ isActive }) => ({
                       display: 'block',
                       padding: '0.75rem 1rem',
                       marginBottom: '0.5rem',
                       borderRadius: '6px',
                       textDecoration: 'none',
                       color: isActive ? '#fff' : 'var(--text-secondary)',
                       backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent'
                     })}
                   >
                     {collapsed ? '➕' : '➕ New Ticket'}
                   </NavLink>

                   <div style={{ opacity: 0.5, marginTop: '0.5rem' }}>
                     <button style={{ 
                        width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'not-allowed'
                      }}>
                       {collapsed ? '🎫' : '🎫 Tickets'}
                     </button>
                     <button style={{ 
                        width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'not-allowed'
                      }}>
                       {collapsed ? '⚙️' : '⚙️ Settings'}
                     </button>
                   </div>
                </nav>

                {/* Logout */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                   <button style={{ 
                     width: '100%', 
                     padding: '0.75rem', 
                     backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                     color: '#ef4444', 
                     border: 'none', 
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: collapsed ? 'center' : 'flex-start',
                     gap: '0.5rem'
                   }}>
                     <span>🚪</span> {!collapsed && 'Logout'}
                   </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Top Header */}
                <header style={{ 
                  height: '60px', 
                  borderBottom: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0 2rem'
                }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{getPageTitle()}</h2>
                  {/* Greeting moved to sidebar, showing profile only */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-secondary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                      }}>
                        VM
                      </div>
                  </div>
                </header>

                {/* Content Outlet */}
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
