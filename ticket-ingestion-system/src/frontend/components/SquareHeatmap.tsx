import { useMemo } from 'react';
import { Ticket } from '../types';

interface Props {
    tickets: Ticket[];
}

export default function SquareHeatmap({ tickets }: Props) {
    const data = useMemo(() => {
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        tickets.forEach(t => {
            const level = t.impactLevel || 'low';
            if (counts[level] !== undefined) counts[level]++;
        });
        const total = tickets.length || 1;
        return {
            critical: { count: counts.critical, pct: Math.round((counts.critical / total) * 100) },
            high: { count: counts.high, pct: Math.round((counts.high / total) * 100) },
            medium: { count: counts.medium, pct: Math.round((counts.medium / total) * 100) },
            low: { count: counts.low, pct: Math.round((counts.low / total) * 100) },
        };
    }, [tickets]);

    const Box = ({ label, color, stat }: { label: string, color: string, stat: { count: number, pct: number } }) => (
        <div style={{
            backgroundColor: color,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            position: 'relative'
        }}>
            <span style={{ fontSize: '1.5rem' }}>{stat.count}</span>
            <span style={{ fontSize: '0.9rem' }}>{stat.pct}%</span>
            <span style={{
                position: 'absolute', bottom: '8px', left: '8px', fontSize: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px'
            }}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0 }}>Incident Heatmap</h3>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                <Box label="CRITICAL" color="#ef4444" stat={data.critical} />
                <Box label="HIGH" color="#f97316" stat={data.high} />
                <Box label="MEDIUM" color="#facc15" stat={data.medium} />
                <Box label="LOW" color="#22c55e" stat={data.low} />
            </div>
        </div>
    );
}
