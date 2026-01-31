import { useState, useEffect } from 'react';

export default function AISummary() {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('/api/ai/summary');
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.summary);
                }
            } catch (error) {
                console.error("Failed to fetch summary", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🤖</span> AI Summary
            </h3>

            <div style={{
                flex: 1,
                backgroundColor: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: '8px',
                lineHeight: '1.6',
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                overflowY: 'auto'
            }}>
                {loading ? (
                    <span style={{ color: 'var(--text-secondary)' }}>Analyzing recent tickets...</span>
                ) : (
                    summary || "No insights available."
                )}
            </div>
        </div>
    );
}
