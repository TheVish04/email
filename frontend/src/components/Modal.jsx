export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop-in"
      onClick={onClose}
    >
      <div
        className={`bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] p-6 w-full ${maxWidth} max-h-[85vh] overflow-hidden flex flex-col shadow-[var(--shadow-lg)] animate-modal-panel-in relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-xl font-semibold mb-4 truncate pr-8 text-[var(--text-primary)]">{title}</h3>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-dark)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
