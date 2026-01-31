import { useNavigate } from 'react-router-dom';
import TicketForm from '../components/TicketForm';

export default function NewTicket() {
  const navigate = useNavigate();

  const handleTicketCreated = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border)]">
          Submit a New Support Request
        </h2>
        <TicketForm onTicketCreated={handleTicketCreated} />
      </div>
    </div>
  );
}
