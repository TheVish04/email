export default function Card({ children, className = '', hover = false, padding = true, ...props }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] ${padding ? 'p-5' : ''
        } ${hover ? 'transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
