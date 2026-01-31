import { useNavigate } from 'react-router-dom';
import TicketForm from '../components/TicketForm';

export default function NewTicket() {
    const navigate = useNavigate();

    const handleTicketCreated = () => {
        // Navigate back to dashboard after successful submission
        // Option: Show toast? For now just redirect.
        navigate('/dashboard');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    Submit a New Support Request
                </h2>
                <TicketForm onTicketCreated={handleTicketCreated} />
            </div>
        </div>
    );
}
