import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register, getRoles } from '../lib/api';

const DEFAULT_ROLES = ['IT', 'HR', 'Finance', 'Customer Support', 'Legal', 'Admin', 'Manager', 'Agent'];
const ROLE_LABELS_FALLBACK = {
  IT: 'Technical Head (IT)',
  HR: 'HR Manager (HR)',
  Finance: 'Finance Lead (Finance)',
  'Customer Support': 'Support Lead (Customer Support)',
  Legal: 'Legal Counsel (Legal)',
  Admin: 'Administrator (Admin)',
  Manager: 'Manager (Management)',
  Agent: 'Support Agent (Agent)',
};

function isNameValid(name) {
  return /^[a-zA-Z\s'-]+$/.test(name) && name.trim().length >= 2;
}

function getPasswordStrengthErrors(password) {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('one number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('one special character (!@#$%^&* etc.)');
  return errors;
}

function EyeIcon({ show }) {
  return show ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  );
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [rolesData, setRolesData] = useState({ roles: [], roleLabels: {} });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getRoles()
      .then(setRolesData)
      .catch(() => setRolesData({ roles: DEFAULT_ROLES, roleLabels: ROLE_LABELS_FALLBACK }));
  }, []);

  const roleList = rolesData.roles?.length ? rolesData.roles : DEFAULT_ROLES;
  const roleLabels = rolesData.roleLabels || ROLE_LABELS_FALLBACK;
  const passwordErrors = getPasswordStrengthErrors(password);
  const nameInvalid = name.trim() && !isNameValid(name.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isNameValid(name.trim())) {
      setError('Full name must contain only letters (no numbers). Spaces and hyphens are allowed.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordErrors.length > 0) {
      setError(`Password must be strong. Use: ${passwordErrors.join(', ')}.`);
      return;
    }
    if (!role) {
      setError('Please select a role / department');
      return;
    }
    setLoading(true);
    try {
      const data = await register({ name: name.trim(), email, password, confirmPassword, role, department: role });
      setAuth(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(e) {
    const v = e.target.value;
    if (/[0-9]/.test(v)) return;
    setName(v);
  }

  const inputBase = 'w-full rounded-[var(--radius-md)] bg-white border border-[var(--border)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all duration-200';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)] px-4 py-8">
      <div className="w-full max-w-md animate-auth-card-in">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-lg)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Create account</h1>
            <p className="text-[var(--text-muted)] mt-2">Get started with your team account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 text-red-600 px-4 py-3 text-sm border border-red-100 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="John Doe"
                className={`${inputBase} ${nameInvalid ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : ''}`}
                required
              />
              {nameInvalid && (
                <p className="mt-1 text-xs text-red-500">Name can only contain letters, spaces, hyphens and apostrophes.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputBase}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputBase}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Confirm</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputBase}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon show={showConfirmPassword} />
                  </button>
                </div>
              </div>
            </div>
            {password.length > 0 && passwordErrors.length > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                Requirements: {passwordErrors.join(', ')}.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Role / Department</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputBase} appearance-none cursor-pointer`}
                  required
                >
                  <option value="">Select role / department</option>
                  {roleList.map((r) => (
                    <option key={r} value={r}>{roleLabels[r] || r}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--radius-md)] bg-[var(--cta)] text-white py-3 font-semibold disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:bg-[var(--cta-hover)] hover:shadow-md active:transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
