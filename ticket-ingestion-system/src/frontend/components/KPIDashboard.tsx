import { useState, useEffect } from 'react';

interface Stats {
    totalTickets: number;
    unseenTickets: number;
    openTickets: number;
}

export default function KPIDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    // Default to current month, though endpoint handles logic
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const fetchStats = async () => {
        try {
            setLoading(true);
            // In a real app we'd pass ?month=${month}, but our mock backend currently ignores specific month param for simplicity
            // logic is hardcoded to "start of current month" or "all time" for Unseen/Open.
            const res = await fetch(`/api/kpi/monthly?month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto refresh every 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [month]);

    const cards = [
        { label: 'Total Tickets (New)', value: stats?.totalTickets, color: '#3b82f6' },
        { label: 'Unseen', value: stats?.unseenTickets, color: '#f59e0b' },
        { label: 'Open Issues', value: stats?.openTickets, color: '#ef4444' },
    ];

    return (
        <div className="kpi-dashboard" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
        }}>
            {cards.map((card, idx) => (
                <div key={idx} className="card" style={{
                    textAlign: 'center',
                    borderTop: `4px solid ${card.color}`,
                    padding: '0.5rem'
                }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {card.label}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {loading ? '-' : card.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
