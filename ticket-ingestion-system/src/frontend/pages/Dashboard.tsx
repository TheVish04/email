import { useState, useEffect, useMemo } from 'react';
import TicketList from '../components/TicketList';
import KPIDashboard from '../components/KPIDashboard';
import SquareHeatmap from '../components/SquareHeatmap';
import AISummary from '../components/AISummary';
import FilterBar from '../components/FilterBar';
import { Ticket } from '../types';

export default function Dashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ intensity: '', sentiment: '', department: '' });

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/tickets');
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleFilterChange = (newFilter: any) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            if (filters.intensity && t.impactLevel !== filters.intensity) return false;
            if (filters.sentiment && t.sentiment !== filters.sentiment) return false;
            if (filters.department && t.department !== filters.department) return false;
            return true;
        });
    }, [tickets, filters]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', width: '100%' }}>
            {/* Row 1: KPI Stats */}
            <div>
                <KPIDashboard />
            </div>

            {/* Row 2: Visuals (Heatmap & AI Summary) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '1.5rem', minHeight: '300px' }}>
                <SquareHeatmap tickets={tickets} />
                <AISummary />
            </div>

            {/* Row 3: Filter Bar */}
            <FilterBar onFilterChange={handleFilterChange} />

            {/* Row 4: Ticket List */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Incident Feed</h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing {filteredTickets.length} tickets
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <TicketList tickets={filteredTickets} loading={loading} />
                </div>
            </div>
        </div>
    );
}
