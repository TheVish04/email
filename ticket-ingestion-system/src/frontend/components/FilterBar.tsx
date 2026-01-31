interface FilterProps {
    onFilterChange: (filters: any) => void;
}

export default function FilterBar({ onFilterChange }: FilterProps) {
    const handleChange = (key: string, value: string) => {
        onFilterChange({ [key]: value });
    };

    const selectStyle = {
        padding: '0.5rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        cursor: 'pointer'
    };

    return (
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Filters:</span>

            <select onChange={(e) => handleChange('intensity', e.target.value)} style={selectStyle}>
                <option value="">All Intensities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>

            <select onChange={(e) => handleChange('sentiment', e.target.value)} style={selectStyle}>
                <option value="">All Sentiments</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
                <option value="positive">Positive</option>
            </select>

            <select onChange={(e) => handleChange('department', e.target.value)} style={selectStyle}>
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Customer Support">Support</option>
            </select>

            {/* Date Range Placeholder */}
            <select style={selectStyle} disabled>
                <option>Last 30 Days</option>
            </select>
        </div>
    );
}
