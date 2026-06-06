import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import { clearAuthToken, getAuthToken } from '../../lib/auth';
import { clearStoredUser, getStoredUser, setStoredUser } from '../../lib/session';
import { getMe, logout, updateMe, type AuthUser } from '../../lib/api';

export function ProfileScreen() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      void navigate({ to: '/login' });
      return;
    }

    void getMe(token)
      .then((currentUser) => {
        setUser(currentUser);
        setStoredUser(currentUser);
        setName(currentUser.name ?? '');
      })
      .catch(() => {
        clearAuthToken();
        clearStoredUser();
        void navigate({ to: '/login' });
      });
  }, [navigate, token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    setBusy(true);
    setError('');

    try {
      const updated = await updateMe(token, { name: name.trim() });
      setUser(updated);
      setStoredUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!token) return;

    try {
      await logout(token);
    } finally {
      clearAuthToken();
      clearStoredUser();
      await navigate({ to: '/login' });
    }
  }

  const initial = (user?.name?.trim()?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  return (
    <div className="flex-1 min-w-0 overflow-auto" style={{ padding: '24px 24px 32px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="text-xs uppercase tracking-wider text-tertiary">Settings</div>
            <h1 className="text-xl font-bold text-primary">Account</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <button className="btn" type="button" onClick={() => void navigate({ to: '/' })}>
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="btn"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.22)',
                color: 'var(--text-primary)',
                padding: '0.7rem 1.15rem',
                minWidth: 116,
              }}
            >
              <LogOut size={14} style={{ opacity: 0.8 }} />
              Log out
            </button>
          </div>
        </div>

        <section
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            padding: '28px 28px 30px',
          }}
        >
          <div className="flex items-center gap-4" style={{ paddingBottom: 4 }}>
            <div
              className="flex items-center justify-center rounded-full text-lg font-bold text-primary shrink-0"
              style={{
                width: 58,
                height: 58,
                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.28), rgba(99, 102, 241, 0.12))',
              }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-primary truncate">
                {user?.name?.trim() || 'Unnamed user'}
              </div>
              <div className="text-sm text-secondary truncate">{user?.email ?? '-'}</div>
            </div>
          </div>

          <form className="flex flex-col" onSubmit={handleSubmit} style={{ gap: 18 }}>
            <label className="flex flex-col" style={{ gap: 8 }}>
              <span className="text-xs uppercase tracking-wider text-tertiary">Display name</span>
              <input
                className="input text-sm"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="flex flex-col" style={{ gap: 8 }}>
              <span className="text-xs uppercase tracking-wider text-tertiary">Email</span>
              <input
                className="input text-sm"
                value={user?.email ?? ''}
                disabled
              />
            </label>

            {error ? <div className="text-sm text-status-delete">{error}</div> : null}

            <div className="flex gap-3" style={{ paddingTop: 4 }}>
              <button className="btn btn-primary h-12" type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
