import { useState } from 'react';
import { classify } from '../lib/api';

export default function TicketForm({ onTicketCreated }) {
  const [formData, setFormData] = useState({
    subject: '',
    sender: '',
    body: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      await classify(formData.subject, formData.body, formData.sender);

      setStatus('success');
      setFormData({ subject: '', sender: '', body: '' });
      onTicketCreated?.();

      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Error submitting ticket. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {status === 'success' && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
          Ticket created successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Enter ticket subject"
            className="w-full rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="sender" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Sender Email
          </label>
          <input
            id="sender"
            type="email"
            value={formData.sender}
            onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
            required
            placeholder="your@email.com"
            className="w-full rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Description
          </label>
          <textarea
            id="body"
            rows={5}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            placeholder="Describe the issue..."
            className="w-full rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-lg py-2.5 px-4 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
