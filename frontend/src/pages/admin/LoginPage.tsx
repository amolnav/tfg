
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authLogin } from '../../services/api';
import '../../styles/pages/admin/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Introduce tu email y contraseña.'); return; }
    setError('');
    setLoading(true);
    try {
      const token = await authLogin(email, password);
      localStorage.setItem('admin_token', token);
      navigate('/admin');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⚓</div>
          <h1 className="login-title">Mesón Marinero</h1>
          <p className="login-subtitle">Panel de Administración</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="admin@mesonmarinero.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? '⏳ Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-back">
          <Link to="/reservar" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ← Ver página de reservas
          </Link>
        </div>
      </div>
    </div>
  );
}
