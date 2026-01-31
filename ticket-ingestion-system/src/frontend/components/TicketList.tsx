import { useState, useMemo } from 'react';
import { Ticket } from '../types';

interface TicketListProps {
    tickets: Ticket[];
    loading: boolean;
}

export default function TicketList({ tickets, loading }: TicketListProps) {
    const [filterUrgency, setFilterUrgency] = useState<boolean>(false);
    const [filterNegative, setFilterNegative] = useState<boolean>(false);

    // Filter Logic
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            if (filterUrgency && !['high', 'critical'].includes(t.urgency || '')) return false;
            if (filterNegative && t.sentiment !== 'negative') return false;
            return true;
        });
    }, [tickets, filterUrgency, filterNegative]);

    if (loading) {
        return <div style={{ color: 'var(--text-secondary)' }}>Loading tickets...</div>;
    }

    if (tickets.length === 0) {
        return <div style={{ color: 'var(--text-secondary)' }}>No tickets found.</div>;
    }

    return (
        <div className="ticket-list">
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => setFilterUrgency(!filterUrgency)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: filterUrgency ? '1px solid #ef4444' : '1px solid var(--border-color)',
                        backgroundColor: filterUrgency ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        color: filterUrgency ? '#ef4444' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    High Importance
                </button>
                <button
                    onClick={() => setFilterNegative(!filterNegative)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: filterNegative ? '1px solid #f87171' : '1px solid var(--border-color)',
                        backgroundColor: filterNegative ? 'rgba(248, 113, 113, 0.1)' : 'transparent',
                        color: filterNegative ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    Negative Sentiment
                </button>
            </div>

            {filteredTickets.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No tickets match filters.</div>
            ) : (
                filteredTickets.map((ticket) => (
                    <TicketItem key={ticket._id} ticket={ticket} />
                ))
            )}
        </div>
    );
}

function TicketItem({ ticket }: { ticket: Ticket }) {
    const [showNormalized, setShowNormalized] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // Department Badge Colors
    const deptColors: Record<string, string> = {
        'IT': '#3b82f6',
        'HR': '#ec4899',
        'Finance': '#10b981',
        'Customer Support': '#f59e0b',
        'General': '#64748b'
    };

    // Urgency Colors
    const urgencyColors: Record<string, string> = {
        'low': '#94a3b8',
        'medium': '#facc15',
        'high': '#f97316',
        'critical': '#ef4444'
    };

    const bg = deptColors[ticket.department || 'General'] || deptColors['General'];
    const urgencyColor = urgencyColors[ticket.urgency || 'medium'] || urgencyColors['medium'];

    const sentimentIcon = ticket.sentiment === 'positive' ? '😊' : ticket.sentiment === 'negative' ? '😟' : '😐';

    return (
        <div className="ticket-item" style={{ borderLeft: `3px solid ${urgencyColor}` }}>
            <div className="ticket-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ticket-subject">{ticket.subject}</span>

                    {/* Sentiment Badge */}
                    <span title={`Sentiment: ${ticket.sentiment}`} style={{ cursor: 'help' }}>
                        {sentimentIcon}
                    </span>
                </div>
                <span className="ticket-meta">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
                <div className="ticket-meta">From: {ticket.sender}</div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Tags */}
                    {ticket.tags && ticket.tags.map(tag => (
                        <span key={tag} style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            #{tag}
                        </span>
                    ))}

                    {/* Department Badge */}
                    {ticket.department && (
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${bg}20`,
                            border: `1px solid ${bg}`,
                            color: bg,
                            fontWeight: 600
                        }}>
                            {ticket.department}
                        </span>
                    )}

                    {/* Urgency Badge */}
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${urgencyColor}20`,
                        border: `1px solid ${urgencyColor}`,
                        color: urgencyColor,
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                    }}>
                        {ticket.urgency}
                    </span>

                    {/* Impact Badge */}
                    {ticket.impactScore !== undefined && (
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: ticket.impactLevel === 'critical' ? '#ef444420' :
                                ticket.impactLevel === 'high' ? '#f9731620' :
                                    ticket.impactLevel === 'medium' ? '#facc1520' : '#10b98120',
                            border: `1px solid ${ticket.impactLevel === 'critical' ? '#ef4444' :
                                    ticket.impactLevel === 'high' ? '#f97316' :
                                        ticket.impactLevel === 'medium' ? '#facc15' : '#10b981'
                                }`,
                            color: ticket.impactLevel === 'critical' ? '#ef4444' :
                                ticket.impactLevel === 'high' ? '#f97316' :
                                    ticket.impactLevel === 'medium' ? '#facc15' : '#10b981',
                            fontWeight: 'bold',
                            marginLeft: 'auto' // Push to right
                        }}>
                            IMPACT: {ticket.impactScore} ({ticket.impactLevel})
                        </span>
                    )}
                </div>
            </div>

            <div className="ticket-body" style={{ marginBottom: '1rem' }}>{ticket.body}</div>

            {/* AI Reasoning Section */}
            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        width: 'auto',
                        marginBottom: '0.25rem'
                    }}
                >
                    {showExplanation ? 'Hide AI Details' : 'View AI details'}
                </button>

                {showExplanation && (
                    <div style={{
                        padding: '0.5rem',
                        borderLeft: `2px solid ${bg}`,
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        <div><strong>Category:</strong> {ticket.departmentReason}</div>
                        {ticket.urgencyReason && <div style={{ marginTop: '4px' }}><strong>Urgency:</strong> {ticket.urgencyReason}</div>}
                        <div style={{ marginTop: '4px', fontSize: '0.8em', opacity: 0.8 }}>Confidence: {Math.round((ticket.departmentConfidence || 0) * 100)}%</div>
                    </div>
                )}
            </div>

            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    type="button"
                    onClick={() => setShowNormalized(!showNormalized)}
                    style={{
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.5rem',
                        width: 'auto',
                        marginTop: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    {showNormalized ? 'Hide Raw Data' : 'View Raw Data'}
                </button>

                {showNormalized && ticket.normalizedText && (
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '0.25rem',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        color: '#cbd5e1'
                    }}>
                        <strong>Normalized:</strong> {ticket.normalizedText}
                        <br />
                        <strong>Lang:</strong> {ticket.language}
                    </div>
                )}
            </div>
        </div>
    );
}
