import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';

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
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? 'Sign In' : 'Sign Up';
  const subtitle =
    mode === 'login'
      ? 'Sign in to continue working.'
      : 'Create an account to get started with Syncarts.';

  return (
    <main
      className="flex items-center justify-center w-screen h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(99, 102, 241, 0.2), transparent 32%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.14), transparent 30%), var(--bg-primary)',
      }}
    >
      <div
        className="absolute"
        style={{
          inset: 'auto auto 10% 8%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.12)',
          filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute"
        style={{
          inset: '8% 10% auto auto',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.10)',
          filter: 'blur(60px)',
        }}
      />

      <section
        className="glass-panel p-6"
        style={{
          width: 'min(440px, calc(100vw - 32px))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wider text-tertiary">Syncarts</div>
          <h1 className="text-xl font-bold text-primary mt-2">{title}</h1>
          <p className="text-sm text-secondary mt-2">{subtitle}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-tertiary">Name</span>
              <input
                className="input text-sm"
                placeholder="Artsrunk"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-tertiary">Email</span>
            <input
              className="input text-sm"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-tertiary">Password</span>
            <input
              className="input text-sm"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error ? <div className="text-sm text-status-delete">{error}</div> : null}

          <button className="btn btn-primary h-12" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-sm text-secondary">
          {mode === 'login' ? (
            <span>
              No account? <Link to="/register" className="text-accent">Sign Up</Link>
            </span>
          ) : (
            <span>
              Already have an account? <Link to="/login" className="text-accent">Sign In</Link>
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
