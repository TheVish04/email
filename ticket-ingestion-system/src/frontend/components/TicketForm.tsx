import React, { useState } from 'react';

interface TicketFormProps {
    onTicketCreated: () => void;
}

export default function TicketForm({ onTicketCreated }: TicketFormProps) {
    const [formData, setFormData] = useState({
        subject: '',
        sender: '',
        body: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMsg('');

        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error('Failed to create ticket');
            }

            setStatus('success');
            setFormData({ subject: '', sender: '', body: '' });
            onTicketCreated();

            // Reset success message after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
            setErrorMsg('Error submitting ticket. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {status === 'success' && (
                <div className="success-msg">Ticket created successfully!</div>
            )}
            {status === 'error' && (
                <div className="error-msg">{errorMsg}</div>
            )}

            <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="Enter ticket subject"
                />
            </div>

            <div className="form-group">
                <label htmlFor="sender">Sender Email</label>
                <input
                    id="sender"
                    type="email"
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    required
                    placeholder="your@email.com"
                />
            </div>

            <div className="form-group">
                <label htmlFor="body">Description</label>
                <textarea
                    id="body"
                    rows={5}
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    placeholder="Describe the issue..."
                />
            </div>

            {/* File input as dummy for now per requirements */}
            <div className="form-group">
                <label htmlFor="attachment">Attachment (Optional)</label>
                <input type="file" id="attachment" disabled />
                <small style={{ color: 'var(--text-secondary)' }}>File upload not implemented in backend yet</small>
            </div>

            <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
            </button>
        </form>
    );
}
