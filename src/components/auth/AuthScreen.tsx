import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { getAuthToken, setAuthToken } from '../../lib/auth';
import { setStoredUser } from '../../lib/session';
import { login, register } from '../../lib/api';

type Mode = 'login' | 'register';

type AuthScreenProps = {
  mode: Mode;
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      void navigate({ to: '/' });
    }
  }, [navigate]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const result =
        mode === 'login'
          ? await login({ email, password })
          : await register({ email, name, password });

      setAuthToken(result.token);
      setStoredUser(result.user);
      await navigate({ to: '/' });
    } catch (err) {
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? 'Sign In' : 'Sign Up';
  const subtitle =
    mode === 'login'
      ? 'Sign in to continue working.'
      : 'Create an account to get started with Syncarts.';

  const handleWindowDrag = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, a, [role="button"]');
    if (event.button !== 0 || isInteractive) return;

    getCurrentWindow().startDragging().catch((err) => {
      console.error('Failed to start window drag', err);
    });
  };

  return (
    <main
      data-tauri-drag-region
      onMouseDown={handleWindowDrag}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(99, 102, 241, 0.2), transparent 32%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.14), transparent 30%), var(--bg-primary)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 'auto auto 10% 8%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.12)',
          filter: 'blur(70px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '8% 10% auto auto',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.10)',
          filter: 'blur(60px)',
        }}
      />

      <section
        className="glass-panel"
        style={{
          padding: 32,
          width: 'min(440px, calc(100vw - 32px))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Syncarts</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>{subtitle}</p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Name</span>
              <input
                className="input"
                style={{ fontSize: 14 }}
                placeholder="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Email</span>
            <input
              className="input"
              style={{ fontSize: 14 }}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Password</span>
            <input
              className="input"
              style={{ fontSize: 14 }}
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.10)',
                color: 'var(--status-delete)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          ) : null}

          <button className="btn btn-primary" style={{ height: 48, marginTop: 4 }} type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          {mode === 'login' ? (
            <span>
              No account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
            </span>
          ) : (
            <span>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            </span>
          )}
        </div>
      </section>
    </main>
  );
}

function getAuthErrorMessage(error: unknown, mode: Mode) {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid email or password') || normalized.includes('unauthorized')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }

  if (normalized.includes('email is already registered')) {
    return 'This email is already registered. Try signing in instead.';
  }

  if (normalized.includes('email') || normalized.includes('password')) {
    return mode === 'login'
      ? 'Please enter a valid email and password.'
      : 'Please enter a valid email and use a password with at least 8 characters.';
  }

  return 'Something went wrong. Please try again.';
}
